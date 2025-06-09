const { upload } = require('../config/multer');
const { File } = require('../config/prismaClient');
const fs = require('fs').promises;
const path = require('path');

const uploadFiles = async (req, res, next) => {
    await upload.array('files', 10)(req, res, async (err) => {
        if (err) {
            return res.render('storage', {
                errors: [{ msg: 'Error uploading files' }]
            });
        }

        console.log('Uploaded files (multer to disk storage):', req.files);

        try {
            // Start transaction for database operations
            await File.createMany({
                data: req.files.map(file => ({
                    name: file.filename,
                    ownerId: req.user.id,
                    parentFolderId: null
                }))
            });
            
            res.redirect('/storage');

        } catch (error) {
            console.error('Database error:', error);
            
            // If database operation fails, delete the uploaded files
            await Promise.all(req.files.map(async file => {
                const filePath = path.join(__dirname, '../uploads', file.filename);
                try {
                    await fs.unlink(filePath);
                } catch (unlinkError) {
                    console.error(`Error deleting file ${filePath}:`, unlinkError);
                }
            }));

            return res.render('storage', {
                errors: [{ msg: 'Error saving file information' }]
            });
        }
    })
}

module.exports = {
    uploadFiles
}