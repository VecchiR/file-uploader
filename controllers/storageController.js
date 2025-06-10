const { upload } = require('../config/multer');
const { File, Folder } = require('../config/prismaClient');
const { processFileData, cleanupUploadedFiles, getStorageItems, getFolderName, deleteRecursively } = require('../lib/storageUtils');


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

    try {
        // First verify the file exists and belongs to the user
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

        // Store the parentFolderId before deleting the file
        const parentFolderId = file.parentFolderId;

        // Delete the file from database
        await File.delete({
            where: {
                id: fileId
            }
        });

        // Redirect back to the current folder or root
        res.redirect(parentFolderId ? `/storage/folder/${parentFolderId}` : '/storage');

    } catch (error) {
        console.error('Error deleting file:', error);
        res.locals.errors = [{ msg: 'Error deleting file' }];
        return renderStorageView(req, res);
    }
};

const deleteFolder = async (req, res) => {
    const folderId = req.params.folderId;

    try {
        // First verify the folder exists and belongs to the user
        const folder = await Folder.findFirst({
            where: {
                id: folderId,
                ownerId: req.user.id
            },
            include: {
                files: true,
                children: true
            }
        });

        if (!folder) {
            res.locals.errors = [{ msg: 'Folder not found or access denied' }];
            return renderStorageView(req, res);
        }

        // Store the parentFolderId before deleting the folder
        const parentFolderId = folder.parentFolderId;

        // Delete the folder and all its contents recursively
        await deleteRecursively(folderId, req.user.id);

        // Redirect back to the parent folder or root
        res.redirect(parentFolderId ? `/storage/folder/${parentFolderId}` : '/storage');

    } catch (error) {
        console.error('Error deleting folder:', error);
        res.locals.errors = [{ msg: 'Error deleting folder' }];
        return renderStorageView(req, res);
    }
};


module.exports = {
    uploadFiles,
    createFolder,
    renderStorageView,
    deleteFile,
    deleteFolder
}