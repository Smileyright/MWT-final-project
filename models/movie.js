const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        require: true
    },
    description: {
        type: String, 
        require: true
    },
    year: {
        type: Number,
        require: true
    },
    genres: {
        type: [String],
        require: true
    },
    rating: {
        type: Number,
        require: true
    }
});

const Movie = mongoose.model("movie", movieSchema);
module.exports = Movie;