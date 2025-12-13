require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

async function run() {
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
    console.log('Connected to database\n');

    const users = await User.find().select('_id username name email createdAt').sort({ createdAt: -1 });
    
    if (users.length === 0) {
      console.log('No users found in the database.');
      console.log('You can create a user by registering through the web app or running the seed script.');
    } else {
      console.log(`Found ${users.length} user(s):\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || user.username}`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
      console.log('\nTo assign movies to a user, use:');
      console.log(`  node scripts/assign_movie_owner.js <userId>`);
      console.log(`  or`);
      console.log(`  node scripts/assign_movie_owner.js <username>`);
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from database');
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

