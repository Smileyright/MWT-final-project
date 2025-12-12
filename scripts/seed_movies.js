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

  // Comprehensive list of movies with various genres
  const movies = [
    // Action Movies
    {
      title: 'The Dark Knight',
      description: 'Batman faces the Joker, a criminal mastermind who thrusts Gotham into anarchy.',
      year: 2008,
      genres: ['Action', 'Crime', 'Drama'],
      userId: user._id
    },
    {
      title: 'Mad Max: Fury Road',
      description: 'In a post-apocalyptic wasteland, Max teams up with a mysterious woman to escape from a tyrannical warlord.',
      year: 2015,
      genres: ['Action', 'Adventure', 'Sci-Fi'],
      userId: user._id
    },
    {
      title: 'John Wick',
      description: 'An ex-hit-man comes out of retirement to track down the gangsters that took everything from him.',
      year: 2014,
      genres: ['Action', 'Crime', 'Thriller'],
      userId: user._id
    },
    
    // Drama Movies
    {
      title: 'The Shawshank Redemption',
      description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
      year: 1994,
      genres: ['Drama'],
      userId: user._id
    },
    {
      title: 'The Godfather',
      description: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.',
      year: 1972,
      genres: ['Crime', 'Drama'],
      userId: user._id
    },
    {
      title: 'Parasite',
      description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.',
      year: 2019,
      genres: ['Thriller', 'Drama', 'Comedy'],
      userId: user._id
    },
    {
      title: '12 Years a Slave',
      description: 'In the antebellum United States, Solomon Northup, a free black man from upstate New York, is abducted and sold into slavery.',
      year: 2013,
      genres: ['Drama', 'History', 'Biography'],
      userId: user._id
    },
    
    // Sci-Fi Movies
    {
      title: 'Inception',
      description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      year: 2010,
      genres: ['Sci-Fi', 'Thriller', 'Action'],
      userId: user._id
    },
    {
      title: 'Interstellar',
      description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
      year: 2014,
      genres: ['Sci-Fi', 'Adventure', 'Drama'],
      userId: user._id
    },
    {
      title: 'The Matrix',
      description: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
      year: 1999,
      genres: ['Sci-Fi', 'Action'],
      userId: user._id
    },
    {
      title: 'Blade Runner 2049',
      description: 'Young Blade Runner K\'s discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard.',
      year: 2017,
      genres: ['Sci-Fi', 'Thriller', 'Drama'],
      userId: user._id
    },
    
    // Comedy Movies
    {
      title: 'The Grand Budapest Hotel',
      description: 'A writer encounters the owner of an aging famous hotel, who tells him of his early years serving as a lobby boy.',
      year: 2014,
      genres: ['Comedy', 'Drama', 'Adventure'],
      userId: user._id
    },
    {
      title: 'Superbad',
      description: 'Two co-dependent high school seniors are forced to deal with separation anxiety after their plan to stage a booze-soaked party goes awry.',
      year: 2007,
      genres: ['Comedy'],
      userId: user._id
    },
    {
      title: 'The Hangover',
      description: 'Three buddies wake up from a bachelor party in Las Vegas, with no memory of the previous night and the bachelor missing.',
      year: 2009,
      genres: ['Comedy'],
      userId: user._id
    },
    
    // Horror Movies
    {
      title: 'Get Out',
      description: 'A young African-American visits his white girlfriend\'s parents for the weekend, where his uneasiness about their reception of him eventually reaches a boiling point.',
      year: 2017,
      genres: ['Horror', 'Mystery', 'Thriller'],
      userId: user._id
    },
    {
      title: 'The Shining',
      description: 'A family heads to an isolated hotel for the winter where a sinister presence influences the father into violence.',
      year: 1980,
      genres: ['Horror', 'Drama', 'Thriller'],
      userId: user._id
    },
    
    // Romance Movies
    {
      title: 'Amélie',
      description: 'Amélie is an innocent and naive girl in Paris with her own sense of justice. She decides to help those around her.',
      year: 2001,
      genres: ['Romance', 'Comedy'],
      userId: user._id
    },
    {
      title: 'La La Land',
      description: 'While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.',
      year: 2016,
      genres: ['Romance', 'Comedy', 'Drama', 'Musical'],
      userId: user._id
    },
    {
      title: 'Before Sunrise',
      description: 'A young man and woman meet on a train in Europe and wind up spending one evening together in Vienna.',
      year: 1995,
      genres: ['Romance', 'Drama'],
      userId: user._id
    },
    
    // Thriller Movies
    {
      title: 'Pulp Fiction',
      description: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.',
      year: 1994,
      genres: ['Crime', 'Drama', 'Thriller'],
      userId: user._id
    },
    {
      title: 'Se7en',
      description: 'Two detectives, a rookie and a veteran, hunt a serial killer who uses the seven deadly sins as his motives.',
      year: 1995,
      genres: ['Crime', 'Drama', 'Thriller', 'Mystery'],
      userId: user._id
    },
    {
      title: 'Gone Girl',
      description: 'With his wife\'s disappearance having become the focus of the media, a man sees the spotlight turned on him when it\'s suspected that he may not be innocent.',
      year: 2014,
      genres: ['Thriller', 'Drama', 'Mystery'],
      userId: user._id
    },
    
    // Adventure Movies
    {
      title: 'The Lord of the Rings: The Fellowship of the Ring',
      description: 'A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth.',
      year: 2001,
      genres: ['Adventure', 'Drama', 'Fantasy'],
      userId: user._id
    },
    {
      title: 'Indiana Jones: Raiders of the Lost Ark',
      description: 'Archaeologist and adventurer Indiana Jones is hired by the U.S. government to find the Ark of the Covenant before the Nazis.',
      year: 1981,
      genres: ['Adventure', 'Action'],
      userId: user._id
    },
    
    // Animation Movies
    {
      title: 'Spirited Away',
      description: 'During her family\'s move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits.',
      year: 2001,
      genres: ['Animation', 'Adventure', 'Family', 'Fantasy'],
      userId: user._id
    },
    {
      title: 'Toy Story',
      description: 'A cowboy doll is profoundly threatened and jealous when a new spaceman figure supplants him as top toy in a boy\'s room.',
      year: 1995,
      genres: ['Animation', 'Adventure', 'Comedy', 'Family'],
      userId: user._id
    },
    
    // Some public/unowned movies for variety
    {
      title: 'The Social Network',
      description: 'As Harvard student Mark Zuckerberg creates the social networking site that would become Facebook, he is sued by the twins who claimed he stole their idea.',
      year: 2010,
      genres: ['Drama', 'Biography'],
    },
    {
      title: 'Whiplash',
      description: 'A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student\'s potential.',
      year: 2014,
      genres: ['Drama', 'Music'],
    },
    {
      title: 'Her',
      description: 'In a near future, a lonely writer develops an unlikely relationship with an operating system designed to meet his every need.',
      year: 2013,
      genres: ['Romance', 'Drama', 'Sci-Fi'],
    }
  ];

  // Insert movies only if they don't already exist
  let inserted = 0;
  let skipped = 0;
  
  for (const movie of movies) {
    const exists = await Movie.findOne({ title: movie.title });
    if (exists) {
      console.log('Skipping existing movie:', movie.title);
      skipped++;
      continue;
    }
    await Movie.create(movie);
    console.log(`✓ Inserted: ${movie.title} (${movie.genres.join(', ')})`);
    inserted++;
  }

  console.log('\n=== Seed Complete ===');
  console.log(`Inserted: ${inserted} movies`);
  console.log(`Skipped: ${skipped} movies`);
  console.log(`Total movies in database: ${await Movie.countDocuments()}`);
  
  // Show genre distribution
  const allGenres = await Movie.distinct('genres');
  console.log(`\nGenres available: ${allGenres.sort().join(', ')}`);
  
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => { 
  console.error('Seed failed:', e); 
  process.exit(1); 
});
