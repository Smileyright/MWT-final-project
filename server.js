const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const PORT = process.env.PORT || 8000
const CONNECTION_STRING = `mongodb+srv://dbUser:dbUserPassword@cluster0.nyug8pi.mongodb.net/FinalProject`

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"))
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json())
app.use(express.urlencoded({ extended: true} ));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    user: null
}));

const movieRoute = require('./routes/movies');
const authRoute = require('./routes/auth');

app.use("/", authRoute);
app.use("/movies", movieRoute);

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

const onServerStart = () => {
    console.log(`The server started running at http://localhost:${PORT}`);
    console.log(`Press Ctrl+c to stop`);

    //connect to database
    connectDB();
}

app.listen(PORT, onServerStart)