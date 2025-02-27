require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(express.static('public'));

const sentinel_TOKEN = process.env.sentinel_TOKEN;
const sentinel_API = '';
const {APP_USERNAME, APP_PASSWORD} = process.env;

// ROUTES

// default, login page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

// content
app.get('./content', (req, res) => {
    res.sendFile(__dirname + '/public/content.html');
});


// LOGIC 

// login 
app.post('/login', (req, res) => {
    const {username, password} = req.body;
    if (username === APP_USERNAME && password === APP_PASSWORD) {
        res.redirect('./content');
    } else {
        res.redirect('./?error=invalid_credentials');
    }
});

// proxy endpoint
app.get('/api/posts', async (req, res) => {
    try {
        const response = await axios.get(`${sentinel_API}/posts`, {
            headers : {
                Authorization : `Bearer ${sentinel_TOKEN}`
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
