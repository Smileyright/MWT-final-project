# MovieWatch - Movie Collection Manager

A web application for managing your personal movie collection. Built with Express.js, MongoDB, and EJS.

## Features

- User authentication (register, login, logout)
- Add, edit, and delete movies
- Browse movies by genre
- View all movies or just your own collection
- Modern, responsive UI

## Prerequisites

- Node.js (v14 or higher)
- MongoDB database (local or cloud like MongoDB Atlas)
- npm or yarn

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

A `.env` file has been created for you. You need to update it with your actual values:

1. Open the `.env` file in the root directory
2. Set your `MONGODB_URI`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   ```
3. (Optional) Set `SESSION_SECRET` - generate a random string:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Then add it to your `.env` file:
   ```
   SESSION_SECRET=your_generated_secret_here
   ```

### 3. Database Setup

#### Option A: Seed the Database (Recommended for testing)

This will create a seed user and add sample movies:

```bash
node scripts/seed_movies.js
```

The seed script creates:
- A user with username: `seeduser` and password: `seedpassword`
- 30+ sample movies across various genres

#### Option B: Create Your Own User

1. Start the server
2. Navigate to `/register`
3. Create your account

### 4. Start the Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:8000` (or the PORT specified in your `.env` file).

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon
- `node scripts/seed_movies.js` - Seed database with sample movies
- `node scripts/list_users.js` - List all users in the database
- `node scripts/assign_movie_owner.js <userId|username>` - Assign unowned movies to a user

## Project Structure

```
MWT-final-project/
├── api/                 # Vercel serverless entry point
├── models/              # Mongoose models (User, Movie)
├── routes/              # Express routes (auth, movies)
├── scripts/             # Utility scripts
├── public/              # Static files (CSS)
├── views/               # EJS templates
│   ├── auth/           # Login/Register pages
│   ├── movies/         # Movie-related pages
│   └── partials/       # Header/Footer components
├── server.js            # Main Express server
├── .env                 # Environment variables (not in git)
└── .env.example         # Environment template
```

## Security Notes

- **Never commit your `.env` file to version control**
- The `.env` file is already in `.gitignore`
- All database credentials must be set via environment variables
- Change default credentials if they were previously exposed in git history

## Deployment

This project is configured for deployment on Vercel:

1. Set environment variables in Vercel dashboard:
   - `MONGODB_URI`
   - `SESSION_SECRET`
   - `NODE_ENV=production`

2. Deploy:
   ```bash
   vercel
   ```

## License

ISC

## Contributors

Group1
