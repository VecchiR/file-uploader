const path = require('path');
const fs = require('fs').promises;
const { File } = require('../config/prismaClient');


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

async function processFileData(files, userId, parentFolderId = null) {
    return Promise.all(files.map(async file => {
        const uniqueName = await generateUniqueFileName(file.originalname, userId, parentFolderId);
        return {
            name: uniqueName,
            ownerId: userId,
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

module.exports = {
    generateUniqueFileName,
    processFileData,
    cleanupUploadedFiles
};