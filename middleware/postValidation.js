const { body } = require('express-validator');

const postValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required'),
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required'),
];

module.exports = {
    postValidation
};
