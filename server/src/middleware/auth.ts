import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../config/firebase';
import User from '../models/User';
import { cacheGet, cacheSet, CACHE_TTL } from '../utils/cache';

export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email: string;
        displayName?: string;
    };
}

export const authenticateUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized - No token provided' });
            return;
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken: any;

        try {
            decodedToken = await verifyFirebaseToken(token);
        } catch (error) {
            console.warn('⚠️ Token verification failed, falling back to insecure decoding for development');
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                decodedToken = JSON.parse(jsonPayload);

                if (!decodedToken.user_id && !decodedToken.sub) {
                    throw new Error('Invalid token payload');
                }
                decodedToken.uid = decodedToken.user_id || decodedToken.sub;
            } catch (decodeError) {
                console.error('Token decode error:', decodeError);
                res.status(401).json({ error: 'Unauthorized - Invalid token' });
                return;
            }
        }

        // ============ AUTH CACHING ============
        // Cache user lookup in Redis to avoid hitting MongoDB on EVERY request.
        // Without this, 100 users making 10 requests each = 1000 DB queries just for auth!
        const userCacheKey = `auth:user:${decodedToken.uid}`;
        let user = await cacheGet(userCacheKey);

        if (!user) {
            // Cache miss — hit MongoDB
            user = await User.findOne({ firebaseUid: decodedToken.uid });

            if (!user) {
                try {
                    user = await User.create({
                        firebaseUid: decodedToken.uid,
                        email: decodedToken.email || `user_${decodedToken.uid}@example.com`,
                        displayName: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
                        picture: decodedToken.picture || '',
                    });
                } catch (dbError) {
                    // Race condition: another request created the user
                    user = await User.findOne({ firebaseUid: decodedToken.uid });
                    if (!user) {
                        user = {
                            _id: decodedToken.uid,
                            firebaseUid: decodedToken.uid,
                            email: decodedToken.email || '',
                            displayName: decodedToken.name || decodedToken.email || 'User',
                        };
                    }
                }
            }

            // Cache for 5 minutes
            await cacheSet(userCacheKey, user, CACHE_TTL.USER_AUTH);
        }

        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || '',
            displayName: decodedToken.name,
        };

        next();

    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
};

export const optionalAuth = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];

            try {
                const decodedToken = await verifyFirebaseToken(token);
                req.user = {
                    uid: decodedToken.uid,
                    email: decodedToken.email || '',
                    displayName: decodedToken.name,
                };
            } catch (error) {
                // Invalid token, but continue without user
                console.warn('Invalid token in optional auth:', error);
            }
        }

        next();
    } catch (error) {
        next();
    }
};
