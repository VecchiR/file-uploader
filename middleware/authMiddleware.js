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

const redirectMember = (req,res,next) => {
    if (req.user.is_member) {
        return res.redirect('/');
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (req.user.is_admin) {
        return next();
    }
    res.status(403).send('Access Denied: Admins Only');
};

module.exports = {
    addAuthState,
    requireAuth,
    redirectIfAuthenticated,
    redirectMember,
    requireAdmin
};
