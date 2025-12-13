const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Movie = require("../models/movie");

//List
router.get("/", async (req, res) => {
    let movies = [];
    let genres = [];
    try {
        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            console.error('Database not connected when loading movies');
            return res.render("movies/index", { movies: [], genres: [], error: "Database connection issue. Please try again." });
        }

        // load distinct genres for the sidebar
        genres = await Movie.distinct('genres');
        genres = (genres || []).sort();

        // Show all movies (including those the current user added)
        movies = await Movie.find().sort({ _id: -1 });
    } catch (e) {
        console.error('Failed to load movies list', e && e.message ? e.message : e);
        movies = [];
    }

    res.render("movies/index", { movies, genres, currentUser: req.session && req.session.user ? req.session.user : null });
});

// My movies - list only movies created by the logged-in user
router.get('/mymovies', async (req, res) => {
    if (!req.session || !req.session.user) return res.redirect('/login');

    try {
        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            console.error('Database not connected when loading user movies');
            return res.render('movies/mymovies', { movies: [], currentUser: req.session.user, error: "Database connection issue. Please try again." });
        }

        // Convert string ID to ObjectId for proper querying
        const myId = new mongoose.Types.ObjectId(req.session.user._id);
        const movies = await Movie.find({ userId: myId }).sort({ _id: -1 });
        return res.render('movies/mymovies', { movies, currentUser: req.session.user });
    } catch (e) {
        console.error('Failed to load user movies', e && e.message ? e.message : e);
        return res.render('movies/mymovies', { movies: [], currentUser: req.session.user });
    }
});

// Helper to escape regex special chars
function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Show movies by genre
router.get('/genre/:genre', async (req, res) => {
    const rawGenre = req.params.genre;
    const genre = decodeURIComponent(rawGenre);
    let movies = [];
    let genres = [];

    try {
        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            console.error('Database not connected when loading movies by genre');
            return res.render('movies/genre', { movies: [], genres: [], selectedGenre: genre, error: "Database connection issue. Please try again.", currentUser: req.session && req.session.user ? req.session.user : null });
        }

        genres = await Movie.distinct('genres');
        genres = (genres || []).sort();

        const genreRegex = new RegExp('^' + escapeRegex(genre) + '$', 'i');

        movies = await Movie.find({ genres: { $regex: genreRegex } }).sort({ _id: -1 });
    } catch (e) {
        console.error('Failed to load movies by genre', e && e.message ? e.message : e);
        movies = [];
    }

    return res.render('movies/genre', { movies, genres, selectedGenre: genre, currentUser: req.session && req.session.user ? req.session.user : null });
});

//Add - must be before /:id route
router.get("/add", (req, res) => {
    console.log('Add movie route hit');
    console.log('Session user:', req.session && req.session.user ? 'exists' : 'missing');
    if (!req.session || !req.session.user) {
        console.log('Redirecting to login - no session');
        return res.redirect("/login");
    }

    res.render("movies/add", { errors: [], old: {} });
});

router.post("/add", async (req, res) => {
    if (!req.session || !req.session.user) return res.redirect("/login");

    try {
        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            console.error('Database not connected when adding movie');
            return res.render("movies/add", { errors: ["Database connection issue. Please try again."], old: req.body });
        }
        const { title, description, year, genres } = req.body;
        const errors = [];

        if (!title || !title.trim()) errors.push("Title is needed");
        if (!description || !description.trim()) errors.push("Description is needed");
        if (!year) errors.push("Year is needed");
        if (year && (isNaN(year) || parseInt(year) < 1888 || parseInt(year) > new Date().getFullYear() + 1)) {
            errors.push("Please enter a valid year");
        }
        if (!genres || !genres.trim()) errors.push("At least one genre is needed");

        if (errors.length > 0) {
            return res.render("movies/add", { errors, old: req.body });
        }

        // Clean and process genres
        const genreArray = genres.split(",")
            .map(g => g.trim())
            .filter(g => g.length > 0)
            .map(g => g.charAt(0).toUpperCase() + g.slice(1).toLowerCase());

        // Convert string ID to ObjectId for proper storage
        const userId = new mongoose.Types.ObjectId(req.session.user._id);
        
        await Movie.create({
            title: title.trim(),
            description: description.trim(),
            year: parseInt(year),
            genres: genreArray,
            userId: userId
        });

        // Redirect to My Movies page after adding
        res.redirect("/movies/mymovies");
    } catch (e) {
        console.error('Error adding movie:', e);
        return res.render("movies/add", { errors: ["Unable to add movie. Please try again."], old: req.body });
    }
});

//Details
router.get("/:id", async (req, res) => {
    try {
        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            console.error('Database not connected when loading movie details');
            return res.status(503).send("Database connection issue. Please try again.");
        }

        const movie = await Movie.findById(req.params.id);

        if (!movie) return res.status(404).send("Movie not found");

        const isOwner = req.session && req.session.user && movie.userId && movie.userId.toString() === req.session.user._id.toString();

        res.render("movies/detail", { movie, isOwner });
    } catch (e) {
        console.error('Error loading movie:', e);
        return res.status(500).send("Error loading movie");
    }
});

//Edit
router.get("/:id/edit", async (req, res) => {
    if (!req.session || !req.session.user) return res.redirect("/login");

    try {
        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            console.error('Database not connected when loading movie for edit');
            return res.status(503).send("Database connection issue. Please try again.");
        }

        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).send("Movie not found");

        // ownership check
        if (!movie.userId || movie.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).send('Forbidden');
        }

        res.render("movies/edit", { movie, errors: [] });
    } catch (e) {
        console.error('Error loading movie for edit:', e);
        return res.status(500).send("Error loading movie");
    }
});

//Post
router.post("/:id/edit", async (req, res) => {
    if (!req.session || !req.session.user) return res.redirect("/login");

    try {
        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            console.error('Database not connected when editing movie');
            const movie = await Movie.findById(req.params.id).catch(() => null);
            return res.render("movies/edit", { movie: movie || {}, errors: ["Database connection issue. Please try again."] });
        }

        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).send("Movie not found");

        // ownership check
        if (!movie.userId || movie.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).send('Forbidden');
        }

        const { title, description, year, genres } = req.body;
        const errors = [];

        if (!title || !title.trim()) errors.push("Title needed");
        if (!year) errors.push("Year needed");
        if (year && (isNaN(year) || parseInt(year) < 1888 || parseInt(year) > new Date().getFullYear() + 1)) {
            errors.push("Please enter a valid year");
        }

        if (errors.length > 0) {
            return res.render("movies/edit", { movie, errors });
        }

        // Clean and process genres
        const genreArray = genres && genres.trim() 
            ? genres.split(",")
                .map(g => g.trim())
                .filter(g => g.length > 0)
                .map(g => g.charAt(0).toUpperCase() + g.slice(1).toLowerCase())
            : movie.genres;

        await Movie.findByIdAndUpdate(req.params.id, {
            title: title.trim(),
            description: description ? description.trim() : movie.description,
            year: parseInt(year),
            genres: genreArray
        });

        res.redirect(`/movies/${req.params.id}`);
    } catch (e) {
        console.error('Error updating movie:', e);
        const movie = await Movie.findById(req.params.id).catch(() => null);
        return res.render("movies/edit", { movie: movie || {}, errors: ["Unable to update movie. Please try again."] });
    }
});

//Delete
router.post("/:id/delete", async (req, res) => {
    if (!req.session || !req.session.user) return res.redirect("/login");

    try {
        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            console.error('Database not connected when deleting movie');
            return res.status(503).send("Database connection issue. Please try again.");
        }

        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).send("Movie not found");

        // ownership check
        if (!movie.userId || movie.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).send('Forbidden');
        }

        await Movie.findByIdAndDelete(req.params.id);

        res.redirect("/movies");
    } catch (e) {
        console.error('Error deleting movie:', e);
        return res.status(500).send("Error deleting movie");
    }
});

module.exports = router;
