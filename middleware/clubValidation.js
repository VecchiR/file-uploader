const { body } = require('express-validator');

const clubValidation = [
    body('password')
        .custom((value) => {
            if (value !== process.env.CLUB_PASSWORD) {
                throw new Error('The password is incorrect!');
            }
            return true;
        })
];

module.exports = {
    clubValidation
};
