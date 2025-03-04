const axios = require('axios');
const SentinelToken = require('../models/sentinelToken.js');
const SENTINEL_AUTH_URL = 'https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token';
const CLIENT_ID = process.env.SENTINEL_CLIENT_ID;
const CLIENT_SECRET = process.env.SENTINEL_CLIENT_SECRET;
const mongoose = require('mongoose');

let refreshingTokenPromise = null; // Prevent duplicate refreshes
    
async function getSentinelToken() {

    // prevent multiple API calls checking DB and requesting a fresh token until DB is updated with fresh token

    if (refreshingTokenPromise) {
        return refreshingTokenPromise;
    }

    const existingToken = await SentinelToken.findById('sentinelToken');
    if (existingToken && new Date() < existingToken.expiresAt) {
        console.log('Sentinel token valid and loaded from DB');
        return existingToken.token;
    }

    refreshingTokenPromise = requestNewSentinelToken();

    try {
        return await refreshingTokenPromise; // wait for refresh
    } finally {
        refreshingTokenPromise = null; 
    }
    
    async function requestNewSentinelToken() {
        console.log('Stored Sentinel token expired, requesting new token');
        try {
            const response = await axios.post(SENTINEL_AUTH_URL, new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET 
            }));
            console.log('New Sentinel token acquired');
            return saveToken(response.data);
        } catch (error) {
            console.error('Error fetching new Sentinel token:', error.response?.data || error.message);
            throw new Error('Failed to get Sentinel token');
        }
    }
    
    async function saveToken(data) {
       
        const { access_token, expires_in } = data;
    
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
    
        await SentinelToken.findByIdAndUpdate('sentinelToken', 
            { token: access_token, expiresAt }, 
            { upsert: true }
        );
        console.log('New Sentinel token stored in DB');
        return access_token;
    }
}

module.exports = getSentinelToken;