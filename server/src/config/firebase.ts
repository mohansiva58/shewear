import admin from 'firebase-admin';

export const initializeFirebase = (): void => {
    try {
        const serviceAccount = {
            type: 'service_account',
            project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_CLIENT_ID,
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: process.env.FIREBASE_CERT_URL,
        };

        // Check if required Firebase env vars exist
        if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
            console.warn('⚠️ Firebase not fully configured, using client-side auth only');
            return;
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        });

        console.log('✅ Firebase Admin initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error);
        // Don't exit process, fall back to client-side Firebase
        console.warn('⚠️ Continuing without Firebase Admin - auth will use client tokens');
    }
};

export const verifyFirebaseToken = async (token: string): Promise<admin.auth.DecodedIdToken> => {
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        return decodedToken;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

export default admin;
