# 🔧 Backend Connection Issue - Quick Fix

## Problem
Frontend can't connect to backend API:
```
POST http://localhost:5000/api/payment/create-order net::ERR_FAILED
```

## Solution

### **RESTART THE BACKEND SERVER**

The backend server needs to be restarted to load all the new files!

1. **Stop the backend** (in the terminal running `npm run dev:server`):
   - Press `Ctrl + C`

2. **Restart it**:
   ```bash
   npm run dev:server
   ```

3. **You should see:**
   ```
   ✅ MongoDB connected successfully
   ✅ Redis connected and ready
   ✅ Firebase Admin initialized successfully
   ✅ Razorpay initialized successfully
   ✅ Email service initialized successfully
   ✅ Server is running on port 5000
   ```

### **If You See Errors:**

#### MongoDB Connection Error:
- Check your `MONGODB_URI` in `.env`
- Make sure MongoDB Atlas is accessible
- Whitelist your IP address

#### Redis Connection Error:
- Check `REDIS_URL` and `REDIS_PASSWORD` in `.env`
- Make sure Redis Cloud is running

#### Firebase Error:
- This is OK! The server will still work
- Firebase Admin is optional for basic testing

## **Testing the Backend**

After restarting, test in a new terminal:

```bash
# Test health endpoint
curl http://localhost:5000/health

# Should return:
# {"status":"OK","timestamp":"...","uptime":...}
```

Or open in browser:
```
http://localhost:5000/health
```

## **Common Issues**

### Port Already in Use:
```bash
# Kill process on port 5000
npx kill-port 5000

# Then restart
npm run dev:server
```

### TypeScript Errors:
The server will still run with warnings. Check the terminal for actual errors (lines starting with ❌).

---

**Once backend restarts successfully, try the payment flow again!** 🚀
