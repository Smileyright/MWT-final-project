const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['admin', 'viewer'],
        default: 'viewer'
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;