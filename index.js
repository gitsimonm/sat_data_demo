require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const session = require('express-session');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const passport = require('passport');
require('./config/passport');
const { router: authRoutes, isAuthenticated } = require('./routes/auth');
const sentinelRoutes = require('./routes/sentinel');
const getSentinelToken = require('./utils/sentinelAuth');
const RateLimit = require('express-rate-limit');

const app = express();

const {SESSION_SECRET, PORT, MONGODB_URI} = process.env;

// database connection
mongoose.connect(MONGODB_URI)
.then(async ()=> {
    console.log('MongoDB connected')
    try {
        let token = await getSentinelToken(); 
        console.log('Sentinel token initialized');
    } catch (error) {
        console.error('Failed to initialize Sentinel token:', error.message);
    }
})
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.set('trust proxy', 1);

app.use(session({
    secret : SESSION_SECRET,
    resave : false,
    saveUninitialized : false,
    store : MongoStore.create({
        mongoUrl : MONGODB_URI,
        collectionName : 'sessions',
        ttl: 14 * 24 * 60 * 60, // 14 days expiry
    }), 
    cookie : {
        httpOnly : true,
        secure : process.env.NODE_ENV === 'production',
        sameSite : 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

app.use(passport.initialize());
app.use(passport.session());

const limiter = RateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per windowMs
});

app.use('/auth', authRoutes);
app.use('/api', sentinelRoutes);
app.use(express.static(path.join(__dirname, 'dist')));

app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    console.log("Session ID:", req.sessionID);
    console.log("Session Data:", req.session);
    next();
});

app.get(['/login', '/login/'], limiter, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/login/login.html'));
});

// redirect root to login
app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/content', limiter, isAuthenticated, (req, res) => {
    console.log('Auth check:', req.isAuthenticated());
    res.set({
        'Content-Security-Policy' : "default-src 'self'; img-src 'self' https://tile.openstreetmap.org blob: data:;",
        'X-Content-Type-Options' : 'nosniff'
    });
    res.sendFile(__dirname + '/dist/content/content.html');
});

// Catch-all route for 404s (must be the last route)
app.use((req, res) => {
    console.log('redirect 404')
    res.redirect('/login');
});

// start server
app.listen(PORT, () => {
    console.log(`Server running on post ${PORT}`);
});
