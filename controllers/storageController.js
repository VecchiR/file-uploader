const { upload } = require('../config/multer');
const { File } = require('../config/prismaClient');

const uploadFiles = async (req, res, next) => {
    await upload.array('files', 10)(req, res, async (err) => {
        if (err) {
            return res.render('storage', {
                errors: [{ msg: 'Error uploading files' }]
            });
        }

        console.log('Uploaded files:', req.files);

        try {

            await File.createMany({
                data: req.files.map(file => ({
                    name: file.filename,
                    ownerId: req.user.id,
                    parentFolderId: null
                }))
            });
        } catch (error) {
            console.error('Database error:', error);
            return res.render('storage', {
                errors: [{ msg: 'Error saving file information' }]
            });
        }

        res.redirect('/storage');
    })
}

module.exports = {
    uploadFiles
}