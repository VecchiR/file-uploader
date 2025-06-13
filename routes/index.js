const router = require('express').Router();
const passport = require('passport');
const { requireAuth, redirectIfAuthenticated } = require('../middleware/authMiddleware');
const { registerValidation } = require('../middleware/userValidation');
const { userController, storageController } = require('../controllers');

router.get('/', (req, res) => {
    res.render('home');
});


router.get('/storage', requireAuth, storageController.renderStorageView);
router.get('/storage/folder/:folderId', requireAuth, storageController.renderStorageView);


router.post('/storage', requireAuth, storageController.uploadFiles);
router.post('/storage/folder/:folderId', requireAuth, storageController.uploadFiles);

router.post('/storage/create-folder', requireAuth, storageController.createFolder);
router.post('/storage/folder/:folderId/create-folder', requireAuth, storageController.createFolder);

// Delete routes
router.post('/storage/file/:fileId/delete', requireAuth, storageController.deleteFile);
router.post('/storage/folder/:folderId/delete', requireAuth, storageController.deleteFolder);

// Rename routes
router.post('/storage/file/:fileId/rename', requireAuth, storageController.renameFile);
router.post('/storage/folder/:folderId/rename', requireAuth, storageController.renameFolder);

// Move item routes
router.get('/storage/movedata', requireAuth, storageController.rootFolderMoveData);
router.get('/storage/file/:fileId/movedata', requireAuth, storageController.getItemMoveData);
router.get('/storage/folder/:folderId/movedata', requireAuth, storageController.getItemMoveData); 


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