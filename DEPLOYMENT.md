# She Wear Deployment Guide

## Prerequisites
- [ ] GitHub repository with your code
- [ ] MongoDB Atlas account for database
- [ ] Cloudinary account for image storage
- [ ] Firebase project for authentication
- [ ] Razorpay account for payments

---

## 🚀 Option 1: Separate Deployment (Recommended)

### Backend Deployment → Render

#### 1. Prepare Backend
Ensure your [server/package.json](server/package.json) has these scripts:
```json
"scripts": {
  "build": "tsc",
  "start": "node dist/server.js"
}
```

#### 2. Deploy to Render
1. Go to [render.com](https://render.com) and sign up
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `shewear-backend`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free (or paid for better performance)

#### 3. Add Environment Variables
In Render dashboard, add these environment variables:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string
REDIS_URL=your_redis_url
JWT_SECRET=your_jwt_secret
FIREBASE_ADMIN_SDK=your_firebase_config_json
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password
FRONTEND_URL=https://your-frontend-url.vercel.app
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

#### 4. Get Backend URL
After deployment, copy your backend URL: `https://shewear-backend.onrender.com`

---

### Frontend Deployment → Vercel

#### 1. Update API Base URL
Update [src/services/api.ts](src/services/api.ts) with your backend URL:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://shewear-backend.onrender.com';
```

#### 2. Deploy to Vercel

**Option A: Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel
```

**Option B: Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

#### 3. Add Environment Variables
In Vercel dashboard → Settings → Environment Variables:

```env
VITE_API_URL=https://shewear-backend.onrender.com
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

#### 4. Deploy
Click **"Deploy"** and wait for build to complete.

---

## 🚀 Option 2: Alternative Platforms

### Backend Alternatives

#### **Railway**
1. Go to [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**
3. Select repository → **Add variables**
4. Railway auto-detects Node.js and deploys

#### **Heroku**
```bash
heroku login
cd server
heroku create shewear-backend
git subtree push --prefix server heroku main
heroku config:set MONGODB_URI=your_uri
```

### Full-Stack on Render
Deploy both frontend and backend as separate services on Render using the included [render.yaml](render.yaml).

---

## 🗄️ Database Setup (MongoDB Atlas)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. **Database Access** → Add user with password
4. **Network Access** → Allow access from anywhere (0.0.0.0/0)
5. **Connect** → Get connection string
6. Replace `<password>` with your password
7. Add to environment variables as `MONGODB_URI`

---

## 🔥 Firebase Setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create project
3. Enable **Authentication** → **Email/Password**
4. **Project Settings** → **Service accounts** → Generate new private key
5. Copy JSON content to `FIREBASE_ADMIN_SDK` variable (backend)
6. Copy web config to frontend environment variables

---

## 📧 Email Setup (Gmail)

1. Enable 2-factor authentication on Gmail
2. Generate App Password: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use generated password as `EMAIL_PASSWORD`

---

## 💳 Razorpay Setup

1. Go to [razorpay.com](https://razorpay.com)
2. Sign up → Get API keys (Test mode)
3. Add `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

---

## 🖼️ Cloudinary Setup

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for free account
3. Dashboard → Copy cloud name, API key, API secret
4. Add to environment variables

---

## ✅ Post-Deployment Checklist

- [ ] Backend health check: `https://your-backend.com/api/health`
- [ ] Frontend loads correctly
- [ ] Authentication works (login/signup)
- [ ] Products display
- [ ] Cart functionality works
- [ ] Checkout and payment work
- [ ] Order creation successful
- [ ] Admin panel accessible

---

## 🔧 Troubleshooting

### CORS Issues
Add frontend URL to backend CORS configuration in [server/src/server.ts](server/src/server.ts):
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-frontend.vercel.app',
  credentials: true
}));
```

### Build Failures
- Check build logs for specific errors
- Verify all dependencies in package.json
- Ensure TypeScript compiles without errors: `npm run build`

### Environment Variables
- Double-check all required variables are set
- Strings with special characters should be quoted
- Firebase SDK should be valid JSON

### Database Connection
- Verify MongoDB URI format
- Check network access settings in MongoDB Atlas
- Ensure user has proper permissions

---

## 📱 Custom Domain (Optional)

### Vercel
1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed

### Render
1. Render Dashboard → Service → Settings → Custom Domain
2. Add domain and update DNS

---

## 🔄 Continuous Deployment

Both Vercel and Render support automatic deployments:
- **Push to GitHub** → Automatically deploys
- **Configure branch:** Deploy from `main` branch
- **Preview deployments:** PR previews automatically created

---

## 📊 Monitoring

### Backend (Render)
- View logs in Render dashboard
- Set up health check endpoints
- Monitor resource usage

### Frontend (Vercel)
- Analytics built-in
- Performance monitoring
- Error tracking with Vercel Analytics

---

## 💰 Cost Estimation

### Free Tier
- **Vercel:** Unlimited for personal projects
- **Render:** 750 hours/month (free)
- **MongoDB Atlas:** 512MB free tier
- **Cloudinary:** 25GB free

### Paid Plans (If needed)
- **Render:** $7/month (starter)
- **Vercel:** $20/month (pro)
- **MongoDB:** $9/month (shared cluster)

---

## 🆘 Support Resources

- **Render Docs:** [render.com/docs](https://render.com/docs)
- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas:** [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

---

**Need help?** Check logs first, then review environment variables, then check service status pages.
