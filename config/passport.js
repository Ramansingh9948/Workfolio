// config/passport.js
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
    // Serialize user (store user ID in session)
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize user (retrieve user from session)
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });

    // Local strategy for authentication using passport-local-mongoose
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
            User.authenticate()(email, password, (err, user, msg) => {
                if (err) return done(err);
                if (!user) return done(null, false, msg);
                return done(null, user);
            });
        })
    );
};
