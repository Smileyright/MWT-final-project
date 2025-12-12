require('dotenv').config();
const mongoose = require('mongoose');
const Movie = require('../models/movie');
const User = require('../models/user');

// Small helper to ensure the URI has a database name. If not, append 'FinalProject'.
function ensureDbName(uri) {
  try {
    if (!uri) return uri;
    // If there's a '/' after .mongodb.net and no database name (next char is ?), insert 'FinalProject'
    const idx = uri.indexOf('.mongodb.net/');
    if (idx === -1) return uri;
    const after = uri.substring(idx + '.mongodb.net/'.length);
    if (after.startsWith('?') || after === '') {
      // append DB name and keep existing query
      const parts = uri.split('.mongodb.net/');
      return parts[0] + '.mongodb.net/FinalProject' + (parts[1] ? parts[1] : '');
    }
    return uri;
  } catch (e) {
    return uri;
  }
}

async function run() {
  const rawUri = process.env.MONGODB_URI;
  if (!rawUri) {
    console.error('No MONGODB_URI found in environment. Set it in your .env file.');
    process.exit(1);
  }

  const uri = ensureDbName(rawUri);
  console.log('Using Mongo URI:', uri.replace(/([A-Za-z0-9_-]+):([A-Za-z0-9_-]+)@/, '***:***@'));

  await mongoose.connect(uri);

  // Ensure a user exists to own seeded movies
  const bcrypt = require('bcrypt');
  let user = await User.findOne({ username: 'seeduser' });
  if (!user) {
    const hash = await bcrypt.hash('seedpassword', 10);
    user = await User.create({ name: 'Seed User', username: 'seeduser', email: 'seed@example.com', password: hash });
    console.log('Created seed user:', user._id.toString());
  } else {
    console.log('Found existing seed user:', user._id.toString());
  }

  const sample = [
    {
      title: 'Inception',
      description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      year: 2010,
      genres: ['Sci-Fi', 'Thriller'],
      rating: 9,
      userId: user._id
    },
    {
      title: 'The Shawshank Redemption',
      description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
      year: 1994,
      genres: ['Drama'],
      rating: 9,
      userId: user._id
    },
    {
      title: 'Pulp Fiction',
      description: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
      year: 1994,
      genres: ['Crime', 'Drama'],
      rating: 9,
      userId: user._id
    },
    {
      title: 'The Godfather',
      description: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
      year: 1972,
      genres: ['Crime', 'Drama'],
      rating: 9,
      userId: user._id
    },
    {
      title: 'Parasite',
      description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
      year: 2019,
      genres: ['Thriller', 'Drama'],
      rating: 8,
      userId: user._id
    },
    {
      title: 'Interstellar',
      description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
      year: 2014,
      genres: ['Sci-Fi', 'Adventure'],
      rating: 8,
      userId: user._id
    }
  ];

  // Add some public/unowned movies so anonymous users and all logged-in users see content
  const publicSample = [
    {
      title: 'The Grand Budapest Hotel',
      description: 'A writer encounters the owner of an aging famous hotel, who tells him of his early years serving as a lobby boy.',
      year: 2014,
      genres: ['Comedy', 'Drama'],
      rating: 8
    },
    {
      title: 'The Dark Knight',
      description: 'Batman faces the Joker, a criminal mastermind who thrusts Gotham into anarchy.',
      year: 2008,
      genres: ['Action', 'Crime'],
      rating: 9
    },
    {
      title: 'Amélie',
      description: 'Amélie is an innocent and naive girl in Paris with her own sense of justice.',
      year: 2001,
      genres: ['Romance', 'Comedy'],
      rating: 8
    }
  ];

  // Insert only if movies don't already exist with those titles
  for (const m of sample) {
    const exists = await Movie.findOne({ title: m.title });
    if (exists) {
      console.log('Skipping existing movie:', m.title);
      continue;
    }
    await Movie.create(m);
    console.log('Inserted movie:', m.title);
  }

  // Insert public (unowned) movies
  for (const m of publicSample) {
    const exists = await Movie.findOne({ title: m.title });
    if (exists) {
      console.log('Skipping existing movie:', m.title);
      continue;
    }
    await Movie.create(m);
    console.log('Inserted public movie:', m.title);
  }

  console.log('Seed complete.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => { console.error('Seed failed:', e); process.exit(1); });
