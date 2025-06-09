const { upload } = require('../config/multer');
const { File } = require('../config/prismaClient');
const fs = require('fs').promises;
const path = require('path');
const { processFileData, cleanupUploadedFiles } = require('../lib/storageUtils');

const uploadFiles = async (req, res, next) => {
    await upload.array('files', 10)(req, res, async (err) => {
        if (err) {
            return res.render('storage', {
                errors: [{ msg: 'Error uploading files' }]
            });
        }

        try {
            const fileData = await processFileData(req.files, req.user.id);

            await File.createMany({
                data: fileData
            });
            
            res.redirect('/storage');

        } catch (error) {
            console.error('Database error:', error);
            
            // If database operation fails, delete the uploaded files
            await cleanupUploadedFiles(req.files);

            return res.render('storage', {
                errors: [{ msg: 'Error saving file information' }]
            });
        }
    });
}

const listFilesAndFolders = async (req, res) => {
    try {
        const files = await File.findMany({
            where: {
                ownerId: req.user.id,
                parentFolderId: null
            }
        });
        res.render('storage', { files });
    } catch (error) {
        console.error('Error fetching files:', error);
        res.render('storage', {
            errors: [{ msg: 'Error fetching files' }]
        });
    }
}


module.exports = {
    uploadFiles,
    listFilesAndFolders
}