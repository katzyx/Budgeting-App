# Deployment Guide

## Local Development

Your app is currently running at: **http://localhost:8080**

To start the development server:
```bash
npm run dev
```

## Deployment Options

### 1. Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Build your project:
```bash
npm run build
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts to connect your GitHub account and deploy.

### 2. Netlify

1. Build your project:
```bash
npm run build
```

2. Go to [netlify.com](https://netlify.com) and sign up
3. Drag and drop the `dist` folder to deploy
4. Or connect your GitHub repository for automatic deployments

### 3. GitHub Pages

1. Add this to your `package.json`:
```json
{
  "homepage": "https://yourusername.github.io/your-repo-name",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

2. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

3. Deploy:
```bash
npm run deploy
```

### 4. Firebase Hosting

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase:
```bash
firebase init hosting
```

4. Build and deploy:
```bash
npm run build
firebase deploy
```

## Environment Variables

If you're using Supabase, make sure to set your environment variables in your deployment platform:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Build Command

All deployment platforms will use:
```bash
npm run build
```

This creates a `dist` folder with your production-ready files. 