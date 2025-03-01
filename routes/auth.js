const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const { model } = require('mongoose');
const user = require('../models/user');

router.post('/login', (req, res, next) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({error:'Email and password are required'});
    }
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({error:info.message});
        req.login(user, (err) => {
            if (err) return next(err);
            console.log('success!')
            console.log(user)
            return res.redirect('/content');
        });
    })(req, res, next);
});


router.post('/logout', (req, res) => {
    req.logout();
    res.json({message : 'Logged out succesfully'});
});

module.exports = router;