const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { validPassword } = require('../lib/passwordUtils');
const { User } = require('./prismaClient');

const verifyCallback = (email, password, done) => {
    User.findUnique({
        where: {
            email: email
        }
    })
        .then((user) => {
            try {
                if (!user) { return done(null, false) }

                const isValid = validPassword(password, user.hash, user.salt);

                if (isValid) {
                    return done(null, user);
                } else {
                    return done(null, false);
                }
            } catch (error) {
                console.error(error);
            }

        })
        .catch((err) => {
            done(err);
        });
};

const strategy = new LocalStrategy({
    usernameField: 'email',    // tell passport to use email field instead of username
    passwordField: 'password'
}, verifyCallback);

passport.use(strategy);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((userId, done) => {
    User.findUnique({
        where: {
            id: userId
        }
    })
        .then((user) => {
            done(null, user);
        })
        .catch(err => done(err));
});