const express = require("express");
const router = express.Router();
const Movie = require("../models/movie");

//List
router.get("/", async (req, res) => {
    const movies = await Movie.find();
    res.render("movies/index", { movies, currentUser: req.session.user });
});

//Add
router.get("/add", (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.type !== 'admin') return res.status(403).send("Access denied");

    res.render("movies/add", { errors: [], old: {}, currentUser: req.session.user  });
});

router.post("/add", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const { title, description, year, genres, rating } = req.body;
    const errors = [];

    if (!title) errors.push("Title is needed");
    if (!description) errors.push("Description is needed");
    if (!year) errors.push("Year is needed");
    if (!rating) errors.push("Rating is needed");
    if (!genres) errors.push("At least one genre is needed");

    if (errors.length > 0) {
        return res.render("movies/add", { errors, old: req.body, currentUser: req.session.user  });
    }
//TODO: check user type before allowing add
    await Movie.create({
        title,
        description,
        year,
        genres: genres.split(","),
        rating,
        userId: req.session.user._id
    });

    res.redirect("/movies");
});

//Details
router.get("/:id", async (req, res) => {
    const movie = await Movie.findById(req.params.id);

    if (!movie) return res.status(404).send("Movie not found");

    res.render("movies/detail", { movie, currentUser: req.session.user  });
});

//Edit
router.get("/edit/:id", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.type !== 'admin') return res.status(403).send("Access denied");

    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).send("Movie not found");

    res.render("movies/edit", { movie, errors: [], currentUser: req.session.user  });
});

//Post
router.post("/edit/:id", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");

    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).send("Movie not found");

    const { title, description, year, genres, rating } = req.body;
    const errors = [];

    if (!title) errors.push("Title needed");
    if (!year) errors.push("Year needed");

    if (errors.length > 0) {
        return res.render("movies/edit", { movie, errors, currentUser: req.session.user  });
    }

    await Movie.findByIdAndUpdate(req.params.id, {
        title,
        description,
        year,
        genres: genres.split(","),
        rating
    });

    res.redirect(`/movies/${req.params.id}`);
});

//Delete
router.post("/delete/:id", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.type !== 'admin') return res.status(403).send("Access denied");

    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).send("Movie not found");

    await Movie.findByIdAndDelete(req.params.id);

    res.redirect("/movies");
});

module.exports = router;
