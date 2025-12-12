const express = require("express");
const router = express.Router();
const Movie = require("../models/movie");

//List
router.get("/", async (req, res) => {
    let movies;
    let genres = [];
    try {
        // load distinct genres for the sidebar
        genres = await Movie.distinct('genres');
        genres = (genres || []).sort();

        // Show all movies (including those the current user added)
        movies = await Movie.find().sort({ _id: -1 });
    } catch (e) {
        console.error('Failed to load movies list', e && e.message ? e.message : e);
        movies = [];
    }

    res.render("movies/index", { movies, genres });
});

// My movies - list only movies created by the logged-in user
router.get('/mine', async (req, res) => {
    if (!req.session || !req.session.user) return res.redirect('/login');

    try {
        const myId = req.session.user._id;
        const movies = await Movie.find({ userId: myId }).sort({ _id: -1 });
        return res.render('movies/mine', { movies });
    } catch (e) {
        console.error('Failed to load user movies', e && e.message ? e.message : e);
        return res.render('movies/mine', { movies: [] });
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
        genres = await Movie.distinct('genres');
        genres = (genres || []).sort();

        const genreRegex = new RegExp('^' + escapeRegex(genre) + '$', 'i');

        movies = await Movie.find({ genres: { $regex: genreRegex } }).sort({ _id: -1 });
    } catch (e) {
        console.error('Failed to load movies by genre', e && e.message ? e.message : e);
        movies = [];
    }

    return res.render('movies/genre', { movies, genres, selectedGenre: genre });
});

//Add
router.get("/add", (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    res.render("movies/add", { errors: [], old: {} });
});

router.post("/add", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
        const { title, description, year, genres, rating } = req.body;
        const errors = [];

        if (!title) errors.push("Title is needed");
        if (!description) errors.push("Description is needed");
        if (!year) errors.push("Year is needed");
        if (!rating) errors.push("Rating is needed");
        if (!genres) errors.push("At least one genre is needed");

        if (errors.length > 0) {
            return res.render("movies/add", { errors, old: req.body });
        }

        await Movie.create({
            title,
            description,
            year,
            genres: genres.split(","),
            rating,
            userId: req.session.user._id
        });

        res.redirect("/movies");
    } catch (e) {
        console.error('Error adding movie:', e);
        return res.render("movies/add", { errors: ["Unable to add movie. Please try again."], old: req.body });
    }
});

//Details
router.get("/:id", async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);

        if (!movie) return res.status(404).send("Movie not found");

        const isOwner = req.session.user && movie.userId && movie.userId.toString() === req.session.user._id.toString();

        res.render("movies/detail", { movie, isOwner });
    } catch (e) {
        console.error('Error loading movie:', e);
        return res.status(500).send("Error loading movie");
    }
});

//Edit
router.get("/:id/edit", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    try {
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
    if (!req.session.user) return res.redirect("/login");

    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) return res.status(404).send("Movie not found");

        // ownership check
        if (!movie.userId || movie.userId.toString() !== req.session.user._id.toString()) {
            return res.status(403).send('Forbidden');
        }

        const { title, description, year, genres, rating } = req.body;
        const errors = [];

        if (!title) errors.push("Title needed");
        if (!year) errors.push("Year needed");

        if (errors.length > 0) {
            return res.render("movies/edit", { movie, errors });
        }

        await Movie.findByIdAndUpdate(req.params.id, {
            title,
            description,
            year,
            genres: genres ? genres.split(",") : movie.genres,
            rating
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
    if (!req.session.user) return res.redirect("/login");

    try {
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
