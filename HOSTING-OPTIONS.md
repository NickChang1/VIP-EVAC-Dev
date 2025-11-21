# Hosting Options for EVAC+

Your team wants to view the app at all times without running it locally. Here are your options:

## 🌟 Recommended: Free Hosting (Best for Students)

### Option 1: Vercel (Frontend) + Railway/Render (Backend) - **EASIEST**

**Cost:** FREE  
**Setup Time:** 15 minutes  
**Best For:** Quick demos, team sharing

#### Frontend on Vercel:
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "Import Project"
4. Select your `EVAC-Dev` repo
5. Vercel auto-detects it's a React app
6. Set root directory to `frontend`
7. Click Deploy!

Your frontend will be live at: `evac-plus.vercel.app` (or custom domain)

#### Backend on Railway:
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `EVAC-Dev` repo
5. Set root directory to `backend`
6. Railway will auto-deploy!

You'll get a URL like: `evac-backend.railway.app`

Then update your frontend `.env`:
```
REACT_APP_API_URL=https://evac-backend.railway.app
```

**Pros:**
- ✅ Completely free
- ✅ Auto-deploys when you push to GitHub
- ✅ Custom domains available
- ✅ Team can access 24/7

**Cons:**
- ⚠️ Railway free tier has monthly limits (500 hours - plenty for a demo)

---

### Option 2: Netlify (Frontend) + Render (Backend)

**Cost:** FREE  
**Similar to Vercel + Railway**

#### Frontend on Netlify:
1. Go to [netlify.com](https://netlify.com)
2. "Add new site" → "Import an existing project"
3. Connect GitHub, select repo
4. Build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `build`

#### Backend on Render:
1. Go to [render.com](https://render.com)
2. "New" → "Web Service"
3. Connect GitHub repo
4. Settings:
   - Root directory: `backend`
   - Build command: `npm install`
   - Start command: `npm start`

---

### Option 3: GitHub Pages (Static Sites Only)

**Cost:** FREE  
**Limitation:** Frontend only, no backend

If you just want to show the UI without live data:
1. Build the frontend: `npm run build`
2. Deploy to GitHub Pages
3. Frontend will be live at: `nchang41.github.io/EVAC-Dev`

**Pros:**
- ✅ Super simple
- ✅ Built into GitHub

**Cons:**
- ❌ No backend (can't get recommendations)
- ❌ No real-time data

---

## 💰 Paid Options (If You Have Budget)

### Option 4: Heroku (Full Stack)

**Cost:** $7-10/month (per service)  
**Setup:** Medium

1. Frontend and Backend both on Heroku
2. Custom domain included
3. Better reliability than free tiers

### Option 5: AWS / Google Cloud / Azure

**Cost:** Variable (usually $10-50/month for small apps)  
**Setup:** Complex  
**Best For:** Production apps or if you want to learn cloud platforms

---

## 🏆 My Recommendation for Your Team

**Use Vercel (Frontend) + Railway (Backend)**

### Why?
1. **FREE** - No credit card needed
2. **Easy** - Connect GitHub, click deploy
3. **Auto-updates** - Push to GitHub → Auto-deploys
4. **Team-friendly** - Everyone gets the same URL
5. **Perfect for presentations** - Just share the link!

### Deployment Steps (Detailed):

#### Step 1: Deploy Backend to Railway

```bash
# First, make sure your code is pushed to GitHub
cd /Users/nickchang/Desktop/VIP/EVAC+
git add .
git commit -m "Prepare for deployment"
git push
```

Then:
1. Go to railway.app → Sign in with GitHub
2. "New Project" → "Deploy from GitHub repo"
3. Select `nchang41/EVAC-Dev`
4. Railway detects Node.js automatically
5. Set environment: Root Directory = `backend`
6. Click Deploy

Railway will give you a URL like: `https://evac-plus-production.up.railway.app`

#### Step 2: Update Frontend Environment Variable

In your local code, update `frontend/.env`:
```env
REACT_APP_API_URL=https://evac-plus-production.up.railway.app
```

Commit and push:
```bash
git add frontend/.env
git commit -m "Update API URL for production"
git push
```

#### Step 3: Deploy Frontend to Vercel

1. Go to vercel.com → Sign in with GitHub
2. "Add New Project"
3. Import `nchang41/EVAC-Dev`
4. Settings:
   - Framework Preset: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
5. Deploy!

Vercel will give you: `https://evac-plus.vercel.app`

#### Step 4: Share with Team

Your team can now access:
- **Frontend:** https://evac-plus.vercel.app
- **Backend API:** https://evac-plus-production.up.railway.app

Available 24/7, no need to run locally!

---

## 📱 Bonus: Custom Domain (Optional)

If you want a custom URL like `evac.gatech.edu`:

1. Talk to GT IT about getting a subdomain
2. In Vercel/Railway settings, add custom domain
3. Point DNS records to Vercel/Railway

---

## 🔄 Continuous Deployment

Once set up, updates are automatic:

```bash
# Make changes to your code
git add .
git commit -m "Added new feature"
git push

# Vercel and Railway automatically detect the push
# and redeploy within 2-3 minutes!
```

Your team always sees the latest version!

---

## ⚠️ Important Notes

1. **Environment Variables:** Make sure `.env` files are configured correctly for production URLs
2. **CORS:** Backend must allow requests from your Vercel domain (already configured with `cors()`)
3. **Free Tier Limits:** 
   - Railway: 500 hours/month (about 20 days of 24/7 usage)
   - Vercel: Unlimited for personal projects
4. **Sleeping Apps:** Free tier backend may "sleep" after inactivity - first request takes 10-30 seconds to wake up

---

## 🆘 Need Help?

If you want me to walk you through the deployment step-by-step, just ask!

I can help with:
- Creating the Railway/Vercel accounts
- Configuring environment variables
- Troubleshooting deployment issues
- Setting up auto-deployment from GitHub
