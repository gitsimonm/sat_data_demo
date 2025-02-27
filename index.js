require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session');

const app = express();

const {SESSION_SECRET, PORT, APP_USERNAME, APP_PASSWORD, SENTINEL_TOKEN, SENTINEL_API} = process.env;

// Middleware

app.use(session({
    secret : SESSION_SECRET,
    resave : false,
    saveUninitialized : false,
    cookie : {
        httpOnly : true,
        secure : process.env.NODE_ENV === 'production',
        sameSote : 'strict',
        maxAge : 1000 * 60 * 15
    }
}));

app.use((req, res, next) => {
    if (req.session.isAuthenticated && req.session.regenerated) {
        req.session.regenerate((err) => {
            if (err) return next(err);
            req.session.isAuthenticated = true;
            req.session.regenerated = true;
            next();
        });
    } else {
        next();
    }
});

app.use(cors());
app.use(express.json());


app.use(express.urlencoded({extended : true}));
app.use(express.static('public'));


// ROUTES

// redirect root to login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// login page
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// content
app.get('./content', (req, res) => {
    if (!req.session.isAuthenticated) {
        return res.redirect('./login');
    }
    res.set({
        'Content-Security-Policy' : "default-src 'self'",
        'X-Content-Type-Options' : 'nosniff'
    });

    res.sendFile(__dirname + '/public/content.html');
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) console.error('Session destruction error:', err);
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});

app.post('/login', (req, res) => {
    const {username, password} = req.body;

    if (username === APP_USERNAME && password === APP_PASSWORD) {
        req.session.regenerate((err) => {
            if (err) return res.status(500).send("Auth error");

            req.session.isAuthenticated = true;
            req.redirect('./content');
        });
    } else {
        res.redirect('/login?error=1'); 
    }
});

// proxy endpoint
app.get('/api/posts', async (req, res) => {
    try {
        const response = await axios.get(`${SENTINEL_API}/posts`, {
            headers : {
                Authorization : `Bearer ${SENTINEL_TOKEN}`
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error : 'Proxy failed'});
    }
});

// start server
app.listen(PORT, () => {
    console.log(`Server running on post ${PORT}`);
});
