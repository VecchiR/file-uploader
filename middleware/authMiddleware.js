// Add authentication state to all views
const addAuthState = (req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.currentUser = req.user;  // This will add the user object to views if logged in
    next();
};

// Protect routes that require authentication
const requireAuth = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
};

// Redirect authenticated users (for login/register pages)
const redirectIfAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return res.redirect('/');
    }
    next();
};

module.exports = {
    addAuthState,
    requireAuth,
    redirectIfAuthenticated
};
