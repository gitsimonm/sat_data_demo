require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const passport = require('passport');
require('./config/passport');

const app = express();

const {SESSION_SECRET, PORT, SENTINEL_TOKEN, SENTINEL_API, MONGODB_URI} = process.env;

// database connection
mongoose.connect(MONGODB_URI)
    .then(()=> console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());

app.use(express.urlencoded({extended : true}));

app.use(session({
    secret : SESSION_SECRET,
    resave : false,
    saveUninitialized : false,
    store : MongoStore.create({mongoUrl : MONGODB_URI}), 
    cookie : {
        // httpOnly : true,
        secure : process.env.NODE_ENV === 'production',
        sameSote : 'strict',
        maxAge : 1000 * 60 * 15
    }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use('/auth', require('./routes/auth'));

// login page
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/dist/login.html');
});

function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

app.get('/content', isAuthenticated, (req, res) => {
    res.set({
        'Content-Security-Policy' : "default-src 'self'; img-src 'self' https://tile.openstreetmap.org;",
        'X-Content-Type-Options' : 'nosniff'
    });

    res.sendFile(__dirname + '/dist/content.html');
});

// app.use((req, res, next) => {
//     if (req.session.isAuthenticated && req.session.regenerated) {
//         req.session.regenerate((err) => {
//             if (err) return next(err);
//             req.session.isAuthenticated = true;
//             req.session.regenerated = true;
//             next();
//         });
//     } else {
//         next();
//     }
// });

// const requireAuth = (req, res, next) => {
//     if (req.session.isAuthenticated) {
//         next();
//     } else {
//         res.redirect('/login');
//     }
// };

// app.use('/dist', requireAuth, express.static(path.join(__dirname, 'dist'), {
//     setHeaders : (res, filePath) => {
//         if (filePath.endsWith('.js')) {
//             res.setHeader('Content-Type', 'application/javascript');
//         }
//     }
// }));

app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});


// redirect root to login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if(err) console.error('Session destruction error:', err);
        res.clearCookie('connect.sid');
        res.redirect('/login');
    });
});


// // content
// app.get('/content', (req, res) => {
//     if (!req.session.isAuthenticated) {
//         return res.redirect('/login');
//     }
//     res.set({
//         'Content-Security-Policy' : "default-src 'self'; img-src 'self' https://tile.openstreetmap.org;",
//         'X-Content-Type-Options' : 'nosniff'
//     });

//     res.sendFile(__dirname + '/dist/content.html');
// });

// app.get('/logout', (req, res) => {
//     req.session.destroy(err => {
//         if(err) console.error('Session destruction error:', err);
//         res.clearCookie('connect.sid');
//         res.redirect('/login');
//     });
// });


// app.post('/login', (req, res) => {
//     console.log('Request headers:', req.headers);
//     console.log('Request body:', req.body);

//     const {username, password} = req.body;
//     console.log(username);
//     console.log(password);
//     if (username === APP_USERNAME && password === APP_PASSWORD) {
//         req.session.regenerate((err) => {
//             if (err) return res.status(500).send("Auth error");

//             req.session.isAuthenticated = true;
//             res.redirect('/content');
//         });
//     } else {
//         res.redirect('/login?error=1'); 
//     }
// });

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
