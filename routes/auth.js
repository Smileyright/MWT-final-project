const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");

// Home route
router.get("/home", (req, res) => {
    console.log('HOME ROUTE HIT from auth routes');
    res.render('index', { 
        title: 'Welcome to MovieWatch',
        currentUser: req.session && req.session.user ? req.session.user : null,
        hideAuthButtons: true
    });
});

//Register form
router.get("/register", (req, res) => {
    res.render("auth/register", { errors: [], old: {} });
});

router.post("/register", async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        const errors = [];
        if (!name) errors.push("Name is needed");
        if (!username) errors.push("Username is needed");
        if (!email) errors.push("Email is needed");
        if (!password) errors.push("Password is needed");

        if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.push("Invalid email");

        // normalize for lookup
        const uname = username ? username.toLowerCase() : '';
        const mail = email ? email.toLowerCase() : '';

        const exists = await User.findOne({ $or: [{ username: uname }, { email: mail }] });
        if (exists) {
            if (exists.username === uname) errors.push("Username already exists");
            if (exists.email === mail) errors.push("Email already registered");
        }

        if (errors.length > 0) {
            return res.render("auth/register", { errors, old: req.body });
        }

        const hash = await bcrypt.hash(password, 10);

        await User.create({ name, username: uname, email: mail, password: hash });

        return res.redirect("/login");
    } catch (e) {
        console.error(e);
        // handle duplicate key error more gracefully
        if (e && e.code === 11000) {
            const errors = ["Username or email already exists"];
            return res.render("auth/register", { errors, old: req.body });
        }
        return res.render("auth/register", { errors: ["Unable to register"], old: req.body });
    }
});

//Login
router.get("/login", (req, res) => {
    res.render("auth/login", { errors: [] });
});

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const uname = username ? username.toLowerCase() : '';
        const user = await User.findOne({ username: uname });

        if (!user)
            return res.render("auth/login", { errors: ["Invalid username or password"] });

        const match = await bcrypt.compare(password, user.password);

        if (!match)
            return res.render("auth/login", { errors: ["Invalid username or password"] });

        // store minimal user info in session
        req.session.user = { _id: user._id.toString(), username: user.username, name: user.name };
        
        // Save session before redirect
        req.session.save((err) => {
            if (err) {
                console.error('Error saving session:', err);
                return res.render("auth/login", { errors: ["Unable to save session"] });
            }
            return res.redirect("/movies");
        });
    } catch (e) {
        console.error(e);
        return res.render("auth/login", { errors: ["Unable to login"] });
    }
});

//Logout
router.get("/logout", (req, res) => {
    const sessionName = req.session && req.session.cookie ? 'moviewatch.sid' : 'connect.sid';
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.clearCookie('moviewatch.sid');
        res.redirect("/");
    });
});

module.exports = router;
