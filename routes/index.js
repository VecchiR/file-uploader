const router = require('express').Router();
const passport = require('passport');
const { requireAuth, redirectIfAuthenticated } = require('../middleware/authMiddleware');
const { registerValidation } = require('../middleware/userValidation');
const { userController } = require('../controllers');

router.get('/', (req, res) => {
    res.render('home');
});


router.get('/upload-file', requireAuth, (req, res) => {
    res.render('upload-file-form');
})


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