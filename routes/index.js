const router = require('express').Router();
const passport = require('passport');
const { registerValidation } = require('../middleware/userValidation');
const { requireAuth, redirectIfAuthenticated } = require('../middleware/authMiddleware');
// const { clubValidation } = require('../middleware/clubValidation');
// const { postValidation } = require('../middleware/postValidation');
const { userController } = require('../controllers');

router.get('/', (req, res) => {
    res.render('home');
});

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


// router.get('/join-club', redirectMember, requireAuth, (req, res) => {
//     res.render("join-club");
// })

// router.post('/join-club', requireAuth, clubValidation, userController.makeMember);

// router.get('/create-post', requireAuth, postController.getPostCreationForm);

// router.post('/create-post', requireAuth, postValidation, postController.createPost);

// router.post("/:postId/delete", requireAuth, requireAdmin, postController.deletePost);


// // Admin Panel Routes
// router.get('/admin-panel', requireAuth, requireAdmin, adminController.getAdminPanel);
// router.post('/admin-panel/search', requireAuth, requireAdmin, adminController.searchUser);
// router.post('/admin-panel/update', requireAuth, requireAdmin, adminController.updateUser);

module.exports = router;