require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Movie = require('./models/movie');
const path = require('path');
const session = require('express-session');
const PORT = process.env.PORT || 8000;
const CONNECTION_STRING = process.env.MONGODB_URI || `mongodb+srv://dbUser:dbUserPassword@cluster0.nyug8pi.mongodb.net/FinalProject`;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (required for auth routes that use `req.session`)
// For Vercel/serverless, use memory store (default)
app.use(session({
    name: 'moviewatch.sid',
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    }
}));

// Expose current user to views (must be after session middleware)
app.use((req, res, next) => {
    if (req.session && req.session.user) {
        res.locals.currentUser = req.session.user;
    } else {
        res.locals.currentUser = null;
    }
    next();
});

const movieRoute = require('./routes/movies');
const authRoute = require('./routes/auth');

const testDB = async () => {
    try {
        const movieToInsert = Movie({
            _id: new mongoose.Types.ObjectId(),
            title: "Inception",
            director: "Christopher Nolan",
            year: 2010,
            genres: ["Sci-Fi", "Thriller"],
            rating: 8.8
        });
        console.log(movieToInsert);
        await movieToInsert.save();
        const movies = await Movie.find();
        console.log(movies);
    } catch (e) {
        console.log(e);
    }
};

const connectDB = async () => {
    try {
        // Don't reconnect if already connected
        if (mongoose.connection.readyState === 1) {
            console.log('Database already connected');
            return;
        }

        if (!CONNECTION_STRING || CONNECTION_STRING.includes('dbUser:dbUserPassword')) {
            console.warn('Warning: Using default MongoDB connection string. Set MONGODB_URI environment variable!');
        }

        console.log(`Attempting to connect to DB...`);
        await mongoose.connect(CONNECTION_STRING, {
            serverSelectionTimeoutMS: 10000, // Timeout after 10s
            socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
            maxPoolSize: 10, // Maintain up to 10 socket connections
        });
        console.log(`Database connection established successfully.`);
        // testDB()
    } catch (error) {
        console.error(`Unable to connect to DB: ${error && error.message ? error.message : error}`);
        // Don't throw - let routes handle it
        return;
    }
};

// Connect to database on first request (works for both local and serverless)
// This middleware must be before routes but errors won't crash the app
app.use(async (req, res, next) => {
    try {
        const state = mongoose.connection.readyState;
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        if (state === 0) {
            console.log('Database not connected, attempting connection...');
            try {
                await connectDB();
            } catch (dbError) {
                console.error('Failed to connect to database:', dbError.message);
                // Continue anyway - routes will handle DB errors
            }
        } else if (state === 2) {
            // Already connecting, wait a bit (max 2 seconds)
            console.log('Database connection in progress, waiting...');
            let waited = 0;
            while (mongoose.connection.readyState === 2 && waited < 2000) {
                await new Promise(resolve => setTimeout(resolve, 100));
                waited += 100;
            }
        }
    } catch (error) {
        console.error('Database middleware error:', error.message);
        // Continue - don't crash
    }
    next();
});

// Render homepage - show My Movies if logged in, otherwise show welcome page
app.get('/', async (req, res) => {
    // If user is logged in, show their movies (same as /movies/mine)
    if (req.session && req.session.user) {
        try {
            const myId = req.session.user._id;
            const movies = await Movie.find({ userId: myId }).sort({ _id: -1 });
            return res.render('movies/mine', { movies });
        } catch (e) {
            console.error('Failed to load user movies', e && e.message ? e.message : e);
            return res.render('movies/mine', { movies: [] });
        }
    }
    
    // If not logged in, show welcome page with Login/Register buttons
    return res.render('index', { 
        title: 'Welcome to MovieWatch'
    });
});

app.use("/", authRoute);
app.use("/movies", movieRoute);

// 404 handler
app.use((req, res) => {
    res.status(404).send('Page not found');
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
    console.error('Error:', err);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    
    // Send error response
    if (req.accepts('html')) {
        res.status(status).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Error ${status}</title>
                <link rel="stylesheet" href="/styles.css">
            </head>
            <body>
                <div class="container" style="padding: 2rem; text-align: center;">
                    <h1>Error ${status}</h1>
                    <p>${message}</p>
                    <a href="/">Go Home</a>
                </div>
            </body>
            </html>
        `);
    } else {
        res.status(status).json({ error: message });
    }
});

// Only start listening if this file is run directly (not imported)
if (require.main === module) {
    const onServerStart = () => {
        console.log(`The server started running at http://localhost:${PORT}`);
        console.log(`Press Ctrl+c to stop`);
        //connect to database
        connectDB();
    };
    app.listen(PORT, onServerStart);
}

// Export for Vercel serverless
// Updated: Ready for deployment
module.exports = app;