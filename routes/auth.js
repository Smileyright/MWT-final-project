const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/user");


//Register form
router.get("/register", (req, res) => {
    res.render("auth/register", { errors: [], old: {}, currentUser: req.session.user  });
});

router.post("/register", async (req, res) => {
    const { username, password, type } = req.body;

    const errors = [];
    if (!username) errors.push("Username is needed");
    if (!password) errors.push("Password is needed");

    const exists = await User.findOne({ username });
    if (exists) errors.push("Username already exists");

    if (errors.length > 0) {
        return res.render("auth/register", { errors, old: req.body, currentUser: req.session.user  });
    }

    const hash = await bcrypt.hash(password, 10);

    await User.create({ username, password: hash, type });

    res.redirect("/");
});

//Login
router.get("", (req, res) => {
    res.render("auth/login", { errors: [], currentUser: req.session.user  });
});

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user)
        return res.render("auth/login", { errors: ["Invalid username or password"], currentUser: req.session.user  });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
        return res.render("auth/login", { errors: ["Invalid username or password"], currentUser: req.session.user  });

    req.session.user = user;

    res.redirect("/movies");
});

//Logout
router.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

module.exports = router;