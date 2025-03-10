const express = require('express');
const router = express.Router();
const passport = require('passport');
const user = require('../models/user');

router.post('/login', async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    passport.authenticate('local', async (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ error: info.message });

        req.login(user, async (err) => {
            if (err) return next(err);
            res.redirect('/content');
        });
    })(req, res, next);
});

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
};

router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
                return res.status(500).json({ error: 'Failed to log out' });
            }
            res.clearCookie('connect.sid'); // Remove session cookie
            res.json({ message: 'Logged out successfully' });
        });
    });
});


module.exports = { router, isAuthenticated };
