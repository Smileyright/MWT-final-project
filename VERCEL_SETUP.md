# Vercel Deployment Setup Guide

## Step 1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click on **"Add New Project"**
3. Click **"Import Git Repository"**
4. If you haven't connected GitHub:
   - Click **"Connect GitHub"**
   - Authorize Vercel to access your repositories
   - Select the repository: `Smileyright/MWT-final-project`
5. Click **"Import"**

## Step 2: Configure Environment Variables

**CRITICAL**: You MUST set these environment variables in Vercel:

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add these variables:

   ```
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_random_secret_string_here
   NODE_ENV=production
   ```

3. For `SESSION_SECRET`, generate a random string (you can use: `openssl rand -base64 32`)

## Step 3: Deploy

1. After setting environment variables, go to **Deployments**
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger automatic deployment

## Step 4: Check Logs if Still Failing

If you still get errors:

1. Go to your deployment in Vercel
2. Click on the deployment
3. Go to **"Functions"** tab
4. Click on the function to see logs
5. Look for error messages - common issues:
   - Missing `MONGODB_URI` environment variable
   - Database connection timeout
   - Missing dependencies

## Troubleshooting

### Error: "Cannot find module"
- Make sure `package.json` has all dependencies
- Vercel should install them automatically

### Error: "Database connection failed"
- Check your `MONGODB_URI` is correct
- Make sure your MongoDB Atlas allows connections from anywhere (0.0.0.0/0) or add Vercel IPs

### Error: "500 Internal Server Error"
- Check Vercel function logs
- Make sure all environment variables are set
- Check that your MongoDB connection string is valid

## File Structure for Vercel

```
MWT-final-project/
├── api/
│   └── index.js          # Vercel serverless entry point
├── server.js             # Main Express app
├── vercel.json           # Vercel configuration
├── package.json
└── ... (other files)
```

The `api/index.js` file exports your Express app for Vercel's serverless functions.

