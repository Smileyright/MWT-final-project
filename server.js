const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Movie = require('./models/movie');
const path = require('path');
const PORT = process.env.PORT || 8000
const CONNECTION_STRING = `mongodb+srv://dbUser:dbUserPassword@cluster0.nyug8pi.mongodb.net/FinalProject`

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json())
app.use(express.urlencoded({ extended: true} ));

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
        .catch( (err) => 
            console.log(`Can't established database connection : ${JSON.stringify(err)}`))
    }catch(error){
        console.log(`Unable to connect to DB : ${error.message}`);
        
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