const { upload } = require('../config/multer');
const { File, Folder } = require('../config/prismaClient');
const { processFileData, cleanupUploadedFiles, getStorageItems } = require('../lib/storageUtils');

const renderStorageView = async (res, options = {}) => {
    try {
        const { files, folders } =
            await getStorageItems(res.locals.currentUser.id);
        res.render('storage', { files, folders, ...options });
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
            return renderStorageView(res, {
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
            return renderStorageView(res, {
                errors: [{ msg: 'Error saving file information' }]
            });
        }
    });
}


const createFolder = async (req, res) => {
    const folderName = req.body.folder_name;

    if (!folderName || folderName.trim() === '') {
        return renderStorageView(res, {
            errors: [{ msg: 'Folder name cannot be empty' }]
        });
    }

    try {
        const existingFolder = await Folder.findFirst({
            where: {
                name: folderName,
                ownerId: req.user.id,
                parentFolderId: null
            }
        });

        if (existingFolder) {
            return renderStorageView(res, {
                errors: [{ msg: 'Folder already exists' }]
            });
        }

        await Folder.create({
            data: {
                name: folderName,
                ownerId: req.user.id,
                parentFolderId: null
            }
        });

        res.redirect('/storage');
    } catch (error) {
        console.error('Error creating folder:', error);
        await renderStorageView(res, {
            errors: [{ msg: 'Error creating folder' }]
        });
    }
}


module.exports = {
    uploadFiles,
    createFolder,
    renderStorageView
}