require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('../models/movie');
const User = require('../models/user');

async function run() {
  const userId = process.argv[2];
  if (!userId) {
    console.error('Usage: node scripts/assign_movie_owner.js <userId>');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Please set MONGODB_URI in your environment or .env file');
    process.exit(1);
  }

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  const user = await User.findById(userId);
  if (!user) {
    console.error('User not found for id', userId);
    process.exit(1);
  }

  const res = await Movie.updateMany({ $or: [{ userId: null }, { userId: { $exists: false } }] }, { $set: { userId: user._id } });
  console.log('Updated', res.modifiedCount, 'movies');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
