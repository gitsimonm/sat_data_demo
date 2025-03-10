const express = require('express');
const axios = require('axios');
const getSentinelToken = require('../utils/sentinelAuth');
const fetch = require('node-fetch');
const router = express.Router();
router.use(express.json());

// middleware
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ error: 'Unauthorized, please log in' });
}

// route
router.post('/sentinel-data', ensureAuthenticated, async (req, res) => {
    try {
        const token = await getSentinelToken();
        const requestData = req.body.body;
        const requestURL = req.body.url;
        
        // Allow-list of acceptable URLs
        const allowedURLs = [
            'https://services.sentinel-hub.com/api/v1/process'
        ];
        
        if (!allowedURLs.includes(requestURL)) {
            return res.status(400).json({ error: 'Invalid URL' });
        }
        
        const response = await fetch(requestURL, {
            method : "POST",
            headers: { 
                "Authorization" : `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body : JSON.stringify(requestData),
            // responseType : 'arraybuffer'
        });
        
        res.setHeader('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        const buffer = await response.buffer();
        res.end(buffer);

    } catch (error) {
        console.error('Error fetching Sentinel data:', error);
        res.status(500).json({ error: 'Failed to fetch Sentinel data' });
    }
});

module.exports = router;
