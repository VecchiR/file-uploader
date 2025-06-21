const router = require('express').Router();
const passport = require('passport');
const { requireAuth, redirectIfAuthenticated } = require('../middleware/authMiddleware');
const { registerValidation } = require('../middleware/userValidation');
const { userController, storageController } = require('../controllers');
const { requireFilePermission, requireFolderPermission } = require('../middleware/permissionMiddleware');
const { Role } = require('../generated/prisma');

router.get('/', (req, res) => {
    res.render('home');
});


router.get('/storage', requireAuth, storageController.renderStorageView);


router.get('/storage/folder/:folderId', requireFolderPermission(Role.VIEWER), storageController.renderStorageView);
router.get('/storage/file/:fileId', requireFilePermission(Role.VIEWER), storageController.getFileDetails);
router.get('/storage/file/:fileId/download', requireFilePermission(Role.VIEWER), storageController.downloadFile);


router.post('/storage', requireAuth, storageController.uploadFiles);
router.post('/storage/folder/:folderId', requireAuth, requireFolderPermission(Role.EDITOR), storageController.uploadFiles);

router.post('/storage/create-folder', requireAuth, storageController.createFolder);
router.post('/storage/folder/:folderId/create-folder', requireAuth, requireFolderPermission(Role.EDITOR), storageController.createFolder);

// Delete routes
router.post('/storage/file/:fileId/delete', requireAuth, requireFolderPermission(Role.EDITOR), storageController.deleteFile);
router.post('/storage/folder/:folderId/delete', requireAuth, requireFolderPermission(Role.EDITOR), storageController.deleteFolder);

// Rename routes
router.post('/storage/file/:fileId/rename', requireAuth, requireFilePermission(Role.EDITOR), storageController.renameFile);
router.post('/storage/folder/:folderId/rename', requireAuth, requireFolderPermission(Role.EDITOR), storageController.renameFolder);

// Move item routes
router.get('/storage/getMoveData', requireAuth, storageController.getItemMoveData);
router.post('/storage/file/:fileId/move/:targetFolderId', requireAuth, requireFilePermission(Role.EDITOR), storageController.moveItem);
router.post('/storage/folder/:folderId/move/:targetFolderId', requireAuth, requireFolderPermission(Role.EDITOR), storageController.moveItem);

router.get('/storage/:itemType/:itemId/permissions', requireAuth, storageController.getItemPermissions);





router.get('/login', redirectIfAuthenticated, (req, res) => {
    res.render('login-form', {
        error: req.flash('error')
    });
});

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/login', failureFlash: 'Invalid username or password.',
    successRedirect: '/'
}));

router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

router.get('/register', redirectIfAuthenticated, (req, res) => {
    res.render("register-form");
});

router.post('/register', registerValidation, userController.createUser);


module.exports = router;