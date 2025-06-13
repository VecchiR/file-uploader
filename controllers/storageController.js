const { upload } = require('../config/multer');
const { File, Folder } = require('../config/prismaClient');
const { processFileData, cleanupUploadedFiles, getStorageItems, getFolderName, handleDelete, handleRename } = require('../lib/storageUtils');


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

const fileMoveData = async (req, res) => {
    await getItemMoveData(req, res, "file");
};

const folderMoveData = async (req, res) => {
    await getItemMoveData(req, res, "folder");
};

const rootFolderMoveData = async (req, res) => {
    try {
        const ownerId = req.user.id;

        const subFolders = await Folder.findMany({
            where: {
                ownerId: ownerId,
                parentFolderId: null
            },
            select: {
                id: true,
                name: true,
                parentFolderId: true,
            }
        });

        const rootFolder = {
            id: null,
            name: 'root',
            parentId: null
        };

        const folderPath = [rootFolder];

        return res.json({
            currentItem: rootFolder,
            currentPath: folderPath,
            availableFolders: subFolders
        });

    } catch (err) {
        console.error('Error fetching move data:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


// START OF CHANGES
// START OF CHANGES
// ATTENTIOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOON!
const getItemMoveData = async (req, res) => {
    try {
        const folderId = req.query.parentFolderId ? req.query.parentFolderId : req.params.folderId;
        const ownerId = req.user.id;

        const currentFolder = await Folder.findUnique({
            where: {
                id: folderId,
                ownerId: ownerId
            },
            select: {
                id: true,
                name: true,
                parentFolderId: true
            }
        });

        if (!currentFolder) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        const folderPath = [];

        const getParentFolders = async (parentId) => {
            if (!parentId) return;

            const parentFolder = await Folder.findUnique({
                where: {
                    id: parentId,
                    ownerId: ownerId
                },
                select: {
                    id: true,
                    name: true,
                    parentFolderId: true,
                }
            });

            if (parentFolder) {
                folderPath.unshift({
                    id: parentFolder.id,
                    name: parentFolder.name,
                    parentId: parentFolder.parentFolderId
                });
                await getParentFolders(parentFolder.parentFolderId);
            }
        };

        // Get current path
        await getParentFolders(currentFolder.parentFolderId);

        // Add itself (current folder) to the end of path
        folderPath.push({
            id: currentFolder.id,
            name: currentFolder.name,
            parentId: currentFolder.parentFolderId
        });

        // Always add root folder at the beginning of the path
        folderPath.unshift({
            id: null,
            name: 'root',
            parentId: null
        });


        const subFolders = await Folder.findMany({
            where: {
                ownerId: ownerId,
                parentFolderId: folderId
            },
            select: {
                id: true,
                name: true,
                parentFolderId: true,
            }
        });



        return res.json({
            currentFolder: {
                id: currentFolder.id,
                name: currentFolder.name,
                parentId: currentFolder.parentFolderId
            },
            currentPath: folderPath,
            availableFolders: subFolders
        });

    } catch (err) {
        console.error('Error fetching move data:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = {
    uploadFiles,
    createFolder,
    renderStorageView,
    deleteFile,
    deleteFolder,
    renameFile,
    renameFolder,
    fileMoveData,
    folderMoveData,
    rootFolderMoveData,
    getItemMoveData
};