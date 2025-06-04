const usersDb = require('../config/userQueries');

exports.getAdminPanel = (req, res) => {
    res.render('admin-panel');
};

exports.searchUser = async (req, res) => {
    try {
        const username = req.body.username;
        const user = await usersDb.getUserByUsername(username);
        
        if (!user) {
            return res.render('admin-panel', {
                errors: [{ msg: 'Username not found' }]
            });
        }

        res.render('admin-panel', { foundUser: user });
    } catch (error) {
        console.error('Error searching user:', error);
        res.render('admin-panel', {
            errors: [{ msg: 'An error occurred while searching for the user' }]
        });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const userId = req.body.userId;
        const isAdmin = req.body.is_admin === 'on'; // checkbox value conversion
        
        const updatedUser = await usersDb.updateUserAdminStatus(userId, isAdmin);
        
        res.render('admin-panel', {
            success: `Successfully updated admin status for user ${updatedUser.username}`
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.render('admin-panel', {
            errors: [{ msg: 'An error occurred while updating the user' }]
        });
    }
};
