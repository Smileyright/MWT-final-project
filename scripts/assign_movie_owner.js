require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('../models/movie');
const User = require('../models/user');

async function run() {
  const userIdentifier = process.argv[2];
  if (!userIdentifier) {
    console.error('Usage: node scripts/assign_movie_owner.js <userId> or <username>');
    console.error('\nTo see all users, run: node scripts/list_users.js');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI environment variable is not set.');
    console.error('Please set MONGODB_URI in your .env file or environment variables.');
    console.error('Example: MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });
    console.log('Connected to database');

    // Try to find user by ID first, then by username
    let user = null;
    if (mongoose.Types.ObjectId.isValid(userIdentifier)) {
      user = await User.findById(userIdentifier);
    }
    
    if (!user) {
      // Try finding by username
      user = await User.findOne({ username: userIdentifier.toLowerCase() });
    }
    
    if (!user) {
      console.error(`User not found for id/username: ${userIdentifier}`);
      console.error('\nTo see all users, run: node scripts/list_users.js');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`Assigning movies to user: ${user.name || user.username} (${user._id})`);

    const res = await Movie.updateMany(
      { $or: [{ userId: null }, { userId: { $exists: false } }] },
      { $set: { userId: user._id } }
    );
    
    console.log(`✓ Updated ${res.modifiedCount} movies`);
    console.log(`Total movies now owned by this user: ${await Movie.countDocuments({ userId: user._id })}`);
    
    await mongoose.disconnect();
    console.log('Disconnected from database');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message || error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

run().catch(e => {
  console.error('Script failed:', e);
  process.exit(1);
});
