const { body } = require('express-validator');

const registerValidation = [
    body('first_name')
        .trim()
        .notEmpty()
        .withMessage('First name is required'),
    body('last_name')
        .trim()
        .notEmpty()
        .withMessage('Last name is required'),
    body('email')
        .trim()
        .notEmpty()
        .withMessage('E-mail is required')
        .bail()
        .isEmail()
        .withMessage('Enter a valid e-mail address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('confirm_password')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match password');
            }
            return true;
        })
];

module.exports = {
    registerValidation
};
