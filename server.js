require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Movie = require('./models/movie');
const path = require('path');
const session = require('express-session');
// connect-mongo v6+ exports an object with MongoStore as a property
const MongoStoreModule = require('connect-mongo');
const MongoStore = MongoStoreModule.MongoStore || MongoStoreModule.default || MongoStoreModule;
const PORT = process.env.PORT || 8000;
const CONNECTION_STRING = process.env.MONGODB_URI;

// Security: Require MONGODB_URI to be set via environment variable
if (!CONNECTION_STRING) {
    console.error('ERROR: MONGODB_URI environment variable is not set.');
    console.error('Please set MONGODB_URI in your .env file or environment variables.');
    console.error('Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
    // This allows the app to start but database operations will fail with clear errors
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (required for auth routes that use `req.session`)
// For Vercel/serverless, use MongoDB store to persist sessions across function invocations
const sessionConfig = {
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
};

// Use MongoDB store if connection string is available, otherwise fall back to memory store
if (CONNECTION_STRING) {
    try {
        // connect-mongo v6+ API - use constructor
        sessionConfig.store = new MongoStore({
            mongoUrl: CONNECTION_STRING,
            touchAfter: 24 * 3600, // lazy session update (24 hours)
            ttl: 24 * 60 * 60, // 24 hours
        });
        console.log('MongoDB session store configured successfully');
    } catch (storeError) {
        console.error('Error creating MongoStore:', storeError);
        console.warn('Falling back to memory store');
    }
} else {
    console.warn('WARNING: MONGODB_URI not set. Sessions will use memory store (not persistent).');
}

app.use(session(sessionConfig));

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
            description: "A mind-bending thriller about dreams within dreams",
            year: 2010,
            genres: ["Sci-Fi", "Thriller"]
        });
        console.log(movieToInsert);
        await movieToInsert.save();
        const movies = await Movie.find();
        console.log(movies);
    } catch (e) {
        console.log(e);
    }
};

// Small helper to ensure the URI has a database name. If not, append 'MWT-FINAL-PROJECT'.
function ensureDbName(uri) {
    try {
        if (!uri) return uri;
        // If there's a '/' after .mongodb.net and no database name (next char is ?), insert 'MWT-FINAL-PROJECT'
        const idx = uri.indexOf('.mongodb.net/');
        if (idx === -1) return uri;
        const after = uri.substring(idx + '.mongodb.net/'.length);
        if (after.startsWith('?') || after === '') {
            // append DB name and keep existing query
            const parts = uri.split('.mongodb.net/');
            return parts[0] + '.mongodb.net/MWT-FINAL-PROJECT' + (parts[1] ? parts[1] : '');
        }
        return uri;
    } catch (e) {
        return uri;
    }
}

const connectDB = async () => {
    try {
        // Don't reconnect if already connected
        if (mongoose.connection.readyState === 1) {
            console.log('Database already connected');
            return;
        }

        if (!CONNECTION_STRING) {
            console.error('ERROR: Cannot connect to database - MONGODB_URI is not set.');
            console.error('Please set MONGODB_URI in your .env file or environment variables.');
            return;
        }

        // Ensure database name is in the connection string
        const uri = ensureDbName(CONNECTION_STRING);
        console.log(`Attempting to connect to DB...`);
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000, 
            socketTimeoutMS: 45000, 
            maxPoolSize: 10, 
        });
        console.log(`Database connection established successfully.`);
        // testDB()
    } catch (error) {
        console.error(`Unable to connect to DB: ${error && error.message ? error.message : error}`);

        return;
    }
};

// Connect to database on first request (works for both local and serverless)
// This middleware must be before routes but errors won't crash the app
app.use(async (req, res, next) => {
    try {
        const state = mongoose.connection.readyState;
        
        if (state === 0) {
            console.log('Database not connected, attempting connection...');
            try {
                await connectDB();
            } catch (dbError) {
                console.error('Failed to connect to database:', dbError.message);
                
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


// Root route - MovieWatch branding/landing page
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'MovieWatch',
        currentUser: req.session && req.session.user ? req.session.user : null
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

module.exports = app;