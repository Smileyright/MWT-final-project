const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");

//Register form
router.get("/register", (req, res) => {
    res.render("auth/register", { errors: [], old: {} });
});

router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    const errors = [];
    if (!username) errors.push("Username is needed");
    if (!password) errors.push("Password is needed");

    const exists = await User.findOne({ username });
    if (exists) errors.push("Username already exists");

    if (errors.length > 0) {
        return res.render("auth/register", { errors, old: req.body });
    }

    const hash = await bcrypt.hash(password, 10);

    await User.create({ username, password: hash });

    res.redirect("/login");
});

//Login
router.get("/login", (req, res) => {
    res.render("auth/login", { errors: [] });
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user)
        return res.render("auth/login", { errors: ["Invalid username or password"] });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
        return res.render("auth/login", { errors: ["Invalid username or password"] });

    req.session.user = user;

    res.redirect("/movies");
});

//Logout
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

module.exports = router;
