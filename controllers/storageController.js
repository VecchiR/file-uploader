const { upload } = require('../config/multer');
const { File, Folder } = require('../config/prismaClient');
const { processFileData, cleanupUploadedFiles, getStorageItems, getFolderName, handleDelete, handleRename, getMoveData } = require('../lib/storageUtils');
const { formatFileSize } = require('../lib/tools');


const renderStorageView = async (req, res) => {

    const folderId = req.params.folderId || null;
    const title = await getFolderName(folderId) || "Storage";

    try {
        const { files, folders } =
            await getStorageItems(req.user.id, folderId);
        res.render('storage', { files, folders, title, folderId });
    } catch (error) {
        console.error('Error rendering storage view:', error);
        res.render('storage', {
            errors: [{ msg: 'Error fetching storage items' }]
        });
    }
};

const uploadFiles = async (req, res, next) => {
    await upload.array('files', 10)(req, res, async (err) => {
        if (err) {
            res.locals.errors = [{ msg: 'Error uploading files' }];
            return renderStorageView(req, res);
        }

        if (!req.files || req.files.length === 0) {
            res.locals.errors = [{ msg: 'No files uploaded' }];
            return renderStorageView(req, res);
        }

        try {
            const fileData = await processFileData(req);

            await File.createMany({
                data: fileData
            });

            res.redirect(req.params.folderId ? `/storage/folder/${req.params.folderId}` : '/storage');

        } catch (error) {
            console.error('Database error:', error);

            // If database operation fails, delete the uploaded files
            await cleanupUploadedFiles(req.files);
            res.locals.errors = [{ msg: 'Error saving file information' }];
            return renderStorageView(req, res);
        }
    });
}


const createFolder = async (req, res) => {
    const folderName = req.body.folder_name;
    const parentFolderId = req.params.folderId || null;

    if (!folderName || folderName.trim() === '') {
        res.locals.errors = [{ msg: 'Folder name cannot be empty' }];
        return renderStorageView(req, res);
    }

    try {
        // First verify that the parent folder exists and belongs to the user if parentFolderId is provided
        if (parentFolderId) {
            const parentFolder = await Folder.findFirst({
                where: {
                    id: parentFolderId,
                    ownerId: req.user.id
                }
            });

            if (!parentFolder) {
                res.locals.errors = [{ msg: 'Parent folder not found' }];
                return renderStorageView(req, res);
            }
        }

        // Check for existing folder with same name in the same location
        const existingFolder = await Folder.findFirst({
            where: {
                name: folderName,
                ownerId: req.user.id,
                parentFolderId: parentFolderId
            }
        });

        if (existingFolder) {
            res.locals.errors = [{ msg: 'Folder already exists in this location' }];
            return renderStorageView(req, res);
        }

        await Folder.create({
            data: {
                name: folderName,
                ownerId: req.user.id,
                parentFolderId: parentFolderId
            }
        });

        // Redirect to parent folder if we're creating inside a folder, otherwise to root
        res.redirect(parentFolderId ? `/storage/folder/${parentFolderId}` : '/storage');
    } catch (error) {
        console.error('Error creating folder:', error);
        res.locals.errors = [{ msg: 'Error creating folder' }];
        await renderStorageView(req, res);
    }
}

const deleteFile = async (req, res) => {
    const fileId = req.params.fileId;
    const result = await handleDelete(req, res, fileId, 'file');

    if (result.error) {
        return renderStorageView(req, res);
    }

    res.redirect(result.parentFolderId ? `/storage/folder/${result.parentFolderId}` : '/storage');
};

const deleteFolder = async (req, res) => {
    const folderId = req.params.folderId;
    const result = await handleDelete(req, res, folderId, 'folder');

    if (result.error) {
        return renderStorageView(req, res);
    }

    res.redirect(result.parentFolderId ? `/storage/folder/${result.parentFolderId}` : '/storage');
};

const renameFile = async (req, res) => {
    const fileId = req.params.fileId;
    const result = await handleRename(req, res, fileId, 'file');

    if (result.error) {
        return renderStorageView(req, res);
    }

    res.redirect(result.parentFolderId ? `/storage/folder/${result.parentFolderId}` : '/storage');
};

const renameFolder = async (req, res) => {
    const folderId = req.params.folderId;
    const result = await handleRename(req, res, folderId, 'folder');

    if (result.error) {
        return renderStorageView(req, res);
    }

    res.redirect(result.parentFolderId ? `/storage/folder/${result.parentFolderId}` : '/storage');
};


const getItemMoveData = async (req, res) => {
    try {
        const moveData = await getMoveData(req, res);
        return res.json(moveData);

    } catch (err) {
        console.error('Error fetching move data:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}



const moveItem = async (req, res) => {
    const itemType = req.path.includes('/file/') ? 'file' : 'folder';
    const itemId = req.params.fileId || req.params.folderId;
    const targetFolderId = req.params.targetFolderId == 'null' ? null : req.params.targetFolderId;

    try {
        const Model = itemType === 'file' ? File : Folder;

        // Verify the item exists and belongs to the user
        const item = await Model.findFirst({
            where: {
                id: itemId,
                ownerId: req.user.id
            }
        });

        if (!item) {
            res.locals.errors = [{ msg: `The ${itemType} was not found or the access was denied.` }];
            // Override the params to show the current folder, not the target
            req.params.folderId = item?.parentFolderId || null;
            return renderStorageView(req, res);
        }

        // Check if an item with the same name already exists in the target location
        const existingItem = await Model.findFirst({
            where: {
                name: item.name,
                parentFolderId: targetFolderId,
                ownerId: req.user.id,
                id: { not: itemId }
            }
        });

        if (existingItem) {
            res.locals.errors = [{ msg: `A ${itemType} with the same name already exists in the target folder.` }];
            // Override the params to show the current folder, not the target
            req.params.folderId = item.parentFolderId;
            return renderStorageView(req, res);
        }

        // Update the item's location by modifying parentFolderId
        await Model.update({
            where: { id: itemId },
            data: { parentFolderId: targetFolderId }
        });

        // Redirect to the target folder after successful move
        req.params.folderId = item.parentFolderId;
        return renderStorageView(req, res);

    } catch (error) {
        console.error(`Error moving ${itemType}:`, error);
        res.locals.errors = [{ msg: `Error moving ${itemType}` }];
        // Override the params to show the original folder
        req.params.folderId = item?.parentFolderId || null;
        return renderStorageView(req, res);
    }
}

const getFileDetails = async (req, res) => {
    const fileId = req.params.fileId;

    try {
        const file = await File.findFirst({
            where: {
                id: fileId,
                ownerId: req.user.id
            }
        });

        if (!file) {
            res.locals.errors = [{ msg: 'File not found or access denied' }];
            return renderStorageView(req, res);
        }


        file.formattedSize = formatFileSize(file.size);

        res.render('file-details', { file });
    } catch (error) {
        console.error('Error fetching file details:', error);
        res.locals.errors = [{ msg: 'Error fetching file details' }];
        return renderStorageView(req, res);
    }
}

const downloadFile = async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const file = await File.findFirst({
            where: {
                id: fileId,
                ownerId: req.user.id
            }
        });

        if (!file) {
            res.locals.errors = [{ msg: 'File not found or access denied' }];
            return renderStorageView(req, res);
        }

        try {
            // Fetch the file from Cloudinary
            const response = await fetch(file.url);
            if (!response.ok) throw new Error('Failed to fetch file from storage');

            // Set headers for download
            res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
            res.setHeader('Content-Type', file.mimeType);

            // Get the response as arraybuffer and send it
            const buffer = await response.arrayBuffer();
            res.send(Buffer.from(buffer));
        } catch (fetchError) {
            console.error('Error downloading file:', fetchError);
            res.locals.errors = [{ msg: 'Error downloading file' }];
            return renderStorageView(req, res);
        }
    }  catch (error) {
        console.error('Error downloading file:', error);
        res.locals.errors = [{ msg: 'Error downloading file' }];
        return renderStorageView(req, res);
    }
}


module.exports = {
    uploadFiles,
    createFolder,
    renderStorageView,
    deleteFile,
    deleteFolder,
    renameFile,
    renameFolder,
    getItemMoveData,
    moveItem,
    getFileDetails,
    downloadFile
};