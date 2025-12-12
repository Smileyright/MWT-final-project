require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Movie = require('./models/movie');
const path = require('path');
const session = require('express-session');
const PORT = process.env.PORT || 8000
const CONNECTION_STRING = process.env.MONGODB_URI || `mongodb+srv://dbUser:dbUserPassword@cluster0.nyug8pi.mongodb.net/FinalProject`

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json())
app.use(express.urlencoded({ extended: true} ));

// Session middleware (required for auth routes that use `req.session`)
app.use(session({
    secret: process.env.SESSION_SECRET || 'change_this_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Expose current user to views
app.use((req, res, next) => {
    res.locals.currentUser = req.session && req.session.user ? req.session.user : null;
    next();
});

// Render a homepage with quick links
app.get('/', (req, res) => {
    return res.render('index', { title: 'Welcome to MovieWatch' });
});

const movieRoute = require('./routes/movies');
const authRoute = require('./routes/auth');

const testDB = async() => {
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
    }   catch(e)    {
        console.log(e); 
    }
}

const connectDB = async() => {
    try{
        console.log(`Attempting to connect to DB`);

        await mongoose.connect(CONNECTION_STRING)
        .then(() => {
            console.log(`Database connection established successfully.`)},
            // testDB()
        )
        .catch( (err) => {
            console.error(`Can't establish database connection. Error object:`);
            console.error(err);
            try { console.error('Error (stringified):', JSON.stringify(err, Object.getOwnPropertyNames(err), 2)); } catch(e) {}
        })
    }catch(error){
        console.error(`Unable to connect to DB : ${error && error.message ? error.message : error}`);
        
    }
}


app.use("/", authRoute);
app.use("/movies", movieRoute);


const onServerStart = () => {
    console.log(`The server started running at http://localhost:${PORT}`);
    console.log(`Press Ctrl+c to stop`);

    //connect to database
    connectDB();
}

app.listen(PORT, onServerStart)