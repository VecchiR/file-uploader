const path = require('path');
const fs = require('fs').promises;
const { File, Folder } = require('../config/prismaClient');


async function generateUniqueFileName(originalName, ownerId, parentFolderId) {
    let baseName = path.parse(originalName).name;
    let extension = path.parse(originalName).ext;
    let currentName = originalName;
    let counter = 1;

    while (true) {
        // Check if a file with this name already exists
        const existingFile = await File.findFirst({
            where: {
                name: currentName,
                ownerId: ownerId,
                parentFolderId: parentFolderId
            }
        });

        if (!existingFile) {
            return currentName;
        }

        // If file exists, generate new name with counter
        currentName = `${baseName}(${counter})${extension}`;
        counter++;
    }
}

async function processFileData(req) {
    return Promise.all(req.files.map(async file => {
        const parentFolderId = req.params.folderId || null;
        const uniqueName = await generateUniqueFileName(file.originalname, req.user.id, parentFolderId);
        return {
            name: uniqueName,
            ownerId: req.user.id,
            parentFolderId: parentFolderId
        };
    }));
}

async function cleanupUploadedFiles(files) {
    await Promise.all(files.map(async file => {
        const filePath = path.join(__dirname, '../uploads', file.filename);
        try {
            await fs.unlink(filePath);
        } catch (unlinkError) {
            console.error(`Error deleting file ${filePath}:`, unlinkError);
        }
    }));
}

async function getStorageItems(userId, parentFolderId = null) {
    try {
        const [files, folders] = await Promise.all([
            File.findMany({
                where: {
                    ownerId: userId,
                    parentFolderId: parentFolderId
                }
            }),
            Folder.findMany({
                where: {
                    ownerId: userId,
                    parentFolderId: parentFolderId
                }
            })
        ]);

        return { files, folders };
    } catch (error) {
        console.error('Error fetching storage items:', error);
        throw error;
    }
}

const getFolderName = async (folderId) => {
    if (!folderId) return null;

    try {
        const folder = await Folder.findUnique({
            where: {
                id: folderId
            },
            select: {
                name: true
            }
        });
        return folder?.name || null;
    } catch (error) {
        console.error('Error fetching folder name:', error);
        return null;
    }
};

async function deleteRecursively(folderId, ownerId) {
    try {
        // Get all files and subfolders
        const folder = await Folder.findFirst({
            where: {
                id: folderId,
                ownerId: ownerId
            },
            include: {
                files: true,
                children: true
            }
        });

        if (!folder) return false;

        // Delete all files in this folder
        if (folder.files.length > 0) {
            await File.deleteMany({
                where: {
                    parentFolderId: folderId
                }
            });
        }

        // Recursively delete all subfolders
        for (const subfolder of folder.children) {
            await deleteRecursively(subfolder.id, ownerId);
        }

        // Finally delete the folder itself
        await Folder.delete({
            where: {
                id: folderId
            }
        });

        return true;
    } catch (error) {
        console.error('Error in recursive deletion:', error);
        throw error;
    }
}

async function handleDelete(req, res, itemId, itemType) {
    try {
        const Model = itemType === 'file' ? File : Folder;
        const includeOptions = itemType === 'folder' ? { include: { files: true, children: true } } : {};

        // Verify the item exists and belongs to the user
        const item = await Model.findFirst({
            where: {
                id: itemId,
                ownerId: req.user.id
            },
            ...includeOptions
        });

        if (!item) {
            res.locals.errors = [{ msg: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found or access denied` }];
            return { error: true, parentFolderId: null };
        }

        // Store the parentFolderId before deleting
        const parentFolderId = item.parentFolderId;

        // Delete the item
        if (itemType === 'file') {
            await File.delete({ where: { id: itemId } });
        } else {
            await deleteRecursively(itemId, req.user.id);
        }

        return { error: false, parentFolderId };

    } catch (error) {
        console.error(`Error deleting ${itemType}:`, error);
        res.locals.errors = [{ msg: `Error deleting ${itemType}` }];
        return { error: true, parentFolderId: null };
    }
}

async function handleRename(req, res, itemId, itemType) {
    const newName = req.body.new_name;

    // Validate name input
    if (!newName || newName.trim() === '') {
        res.locals.errors = [{ msg: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} name cannot be empty` }];
        return { error: true, parentFolderId: null };
    }

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
            res.locals.errors = [{ msg: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} not found or access denied` }];
            return { error: true, parentFolderId: null };
        }

        // Check if an item with the new name already exists in the same location
        const existingItem = await Model.findFirst({
            where: {
                name: newName,
                ownerId: req.user.id,
                parentFolderId: item.parentFolderId,
                id: { not: itemId } // Exclude the current item
            }
        });

        if (existingItem) {
            res.locals.errors = [{ msg: `A ${itemType} with this name already exists in this location` }];
            return { error: true, parentFolderId: null };
        }

        // Update the item name
        await Model.update({
            where: { id: itemId },
            data: { name: newName }
        });

        return { error: false, parentFolderId: item.parentFolderId };

    } catch (error) {
        console.error(`Error renaming ${itemType}:`, error);
        res.locals.errors = [{ msg: `Error renaming ${itemType}` }];
        return { error: true, parentFolderId: null };
    }
}

async function getMoveData(req, res) {
    // initialize folder path, which will be returned in the response to populate the dialog
    const folderPath = [];

    const isRootFolder = req.query.folderId ? false : true;

    // get info for the folder from db (or set it as the root)
    let currentFolder;

    if (isRootFolder) {
        currentFolder = {
            id: null,
            name: 'root',
            parentId: null
        }

        // in this scenario, the path is just the root folder
        folderPath.push(currentFolder);

    }

    else {
        currentFolder = await Folder.findUnique({
            where: {
                id: req.query.folderId,
                ownerId: req.user.id
            },
            select: {
                id: true,
                name: true,
                parentFolderId: true
            }
        });

        if (!currentFolder) {
            return res.status(404).json({ error: 'Folder not found' }); /////////// HOWWWWWWWWWWWWWWW DO I HANDLE THIS???????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????/
            // I DON'T WANT TO USE "RES" HERE. ISN'T THIS A JOB FOR THE CONTROLLER?
        }

        // DEFINITION - function to get the folder hierarchy untill current folder
        const getParentFolders = async (parentId) => {
            if (!parentId) return;

            const parentFolder = await Folder.findUnique({
                where: {
                    id: parentId,
                    ownerId: req.user.id
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

        // EXECUTION - Get current path
        await getParentFolders(currentFolder.parentFolderId);

        // Add current folder to the end of path
        folderPath.push({
            id: currentFolder.id,
            name: currentFolder.name,
            parentId: currentFolder.parentFolderId
        });

        // Add root folder at the beginning of the path (hard-coded because root isn't actually a "folder" in the db. Items are known to be on the root because they have an "id" but a "parentId" = null  - I'm saying that because the "root folder" here also has a "parentId" = null, HOWEVER it itself does not have an "id")
        folderPath.unshift({
            id: null,
            name: 'root',
            parentId: null
        });
    }


    // get the children (folders) inside the current folder, which will be available for the move operation and displayed in the modal
    const subFolders = await Folder.findMany({
        where: {
            ownerId: req.user.id,
            parentFolderId: currentFolder.id
        },
        select: {
            id: true,
            name: true,
            parentFolderId: true,
        }
    });

    return {
        currentFolder: {
            id: currentFolder.id,
            name: currentFolder.name,
            parentId: currentFolder.parentFolderId
        },
        currentPath: folderPath,
        availableFolders: subFolders
    };
}

module.exports = {
    generateUniqueFileName,
    processFileData,
    cleanupUploadedFiles,
    getStorageItems,
    getFolderName,
    deleteRecursively,
    handleDelete,
    handleRename,
    getMoveData
};