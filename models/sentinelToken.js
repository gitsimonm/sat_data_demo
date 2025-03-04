const mongoose = require('mongoose');

const sentinelTokenSchema = new mongoose.Schema({
    _id : {type : String, default : 'sentinelToken'},
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model('SentinelToken', sentinelTokenSchema);