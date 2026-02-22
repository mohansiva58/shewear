# Firebase Admin SDK Setup Guide

## Problem
The backend can't verify user authentication because Firebase Admin SDK credentials are missing.

**Error:** `Service account object must contain a string "private_key" property`

---

## Solution: Get Firebase Service Account Credentials

### Step 1: Go to Firebase Console
Visit: https://console.firebase.google.com/project/rarerabbit-a412f/settings/serviceaccounts/adminsdk

Or:
1. Go to https://console.firebase.google.com
2. Select your project: **rarerabbit-a412f**
3. Click ⚙️ (Settings) → **Project settings**
4. Go to **Service accounts** tab

### Step 2: Generate Private Key
1. Click **"Generate new private key"** button
2. Confirm by clicking **"Generate key"**
3. A JSON file will download (e.g., `rarerabbit-a412f-firebase-adminsdk-xxxxx.json`)

### Step 3: Extract Values from Downloaded JSON

Open the downloaded JSON file. It looks like:
```json
{
  "type": "service_account",
  "project_id": "rarerabbit-a412f",
  "private_key_id": "a1b2c3d4e5f6...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@rarerabbit-a412f.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx@rarerabbit-a412f.iam.gserviceaccount.com"
}
```

### Step 4: Update Your `.env` File

Copy these values from the JSON to `server/.env`:

```env
FIREBASE_PRIVATE_KEY_ID=a1b2c3d4e5f6...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@rarerabbit-a412f.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789012345678901
FIREBASE_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx@rarerabbit-a412f.iam.gserviceaccount.com
```

**Important Notes:**
- Keep the **double quotes** around `FIREBASE_PRIVATE_KEY`
- Keep the `\n` characters in the private key (they represent line breaks)
- Make sure there are NO extra spaces

### Step 5: Restart Your Backend Server

```bash
cd server
npm run dev
```

You should see: ✅ **Firebase Admin initialized successfully**

---

## Quick Copy Template

Replace the values with yours from the downloaded JSON:

```env
FIREBASE_PRIVATE_KEY_ID=paste_private_key_id_here
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\npaste_your_full_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@rarerabbit-a412f.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=paste_client_id_here
FIREBASE_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx@rarerabbit-a412f.iam.gserviceaccount.com
```

---

## Verification

After updating, check the backend logs for:
- ✅ `Firebase Admin initialized successfully`
- ✅ `Connected to MongoDB`
- ✅ `Server running on port 5000`

If you see ❌ errors, double-check:
1. Private key has double quotes
2. All `\n` characters are preserved
3. No extra spaces or line breaks
4. All values copied correctly

---

## Security Warning

⚠️ **NEVER commit the Firebase service account JSON or these environment variables to Git!**

The `.env` file should already be in `.gitignore`.
