# 🚀 She Wear - Quick Start Guide

## Step 1: Install Dependencies ✅
```bash
# Root (frontend)
npm install

# Backend
cd server
npm install
cd ..
```

## Step 2: Verify Environment Variables
Check that `.env` file has all required values:
- ✅ MongoDB URI
- ✅ Redis URL & Password 
- ✅ Firebase credentials
- ✅ Razorpay keys
- ✅ Email configuration

## Step 3: Seed Database
```bash
npm run seed
```

This will:
- Connect to MongoDB
- Clear existing products
- Add 6 sample products
- Display summary

## Step 4: Start Servers

### Option A: Both Together (Recommended)
```bash
npm run dev:all
```

### Option B: Separately
```bash
# Terminal 1 - Backend (Port 5000)
npm run dev:server

# Terminal 2 - Frontend (Port 5173)
npm run dev
```

## Step 5: Access Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## Step 6: Test the Flow
1. Browse products (loads from MongoDB)
2. Sign up with Firebase (email or Google)
3. Add products to cart (syncs to Redis + MongoDB)
4. Go to checkout
5. Enter shipping address
6. Choose payment method:
   - **Razorpay**: Test with card 4111 1111 1111 1111
   - **COD**: Direct order placement
7. Order confirmation + email sent!

## 🔍 Verify Everything Works

### Check Backend is Running
```bash
curl http://localhost:5000/health
```
Should return: `{"status":"OK",...}`

### Check Products API
```bash
curl http://localhost:5000/api/products
```
Should return array of products

### Check MongoDB Connection
Look for: `✅ MongoDB connected successfully` in terminal

### Check Redis Connection
Look for: `✅ Redis connected and ready` in terminal

### Check Email Service
Look for: `✅ Email service initialized successfully` in terminal

## 📝 Common Issues

### Port Already in Use
```bash
# Kill process on port 5000 (backend)
npx kill-port 5000

# Kill process on port 5173 (frontend)
npx kill-port 5173
```

### MongoDB Connection Error
- Verify MONGODB_URI is correct
- Check MongoDB Atlas whitelist (allow your IP)
- Ensure database user has read/write permissions

### Redis Connection Error
- Verify REDIS_URL and REDIS_PASSWORD
- Check Redis Cloud is active
- Try pinging Redis from their dashboard

### Firebase Auth Not Working
- Verify all NEXT_PUBLIC_FIREBASE_* variables
- Enable Email/Password + Google in Firebase Console
- Add localhost to authorized domains

### Razorpay Payment Fails
- Use test mode credentials
- Use test card: 4111 1111 1111 1111
- Check RAZORPAY_KEY_ID and KEY_SECRET match

## 🎯 Next Steps

1. **Customize Products**: Edit `server/src/seed.ts`
2. **Update Styling**: Modify files in `src/components/`
3. **Add Features**: Extend API in `server/src/`
4. **Deploy**: See `README.md` for deployment guide

## 📚 Documentation

- **Full API Docs**: See `README.md`
- Implementation Plan**: `.agent/IMPLEMENTATION_PLAN.md`
- **Environment Variables**: Root `.env` file

## ✅ Checklist

- [ ] Dependencies installed (frontend + backend)
- [ ] Environment variables configured
- [ ] Database seeded with products
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] MongoDB connected
- [ ] Redis connected
- [ ] Can browse products
- [ ] Can sign up/login
- [ ] Can add to cart
- [ ] Can place order
- [ ] Email confirmation received

🎉 **You're all set!** Happy coding!
