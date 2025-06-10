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

module.exports = {
    generateUniqueFileName,
    processFileData,
    cleanupUploadedFiles,
    getStorageItems,
    getFolderName
};