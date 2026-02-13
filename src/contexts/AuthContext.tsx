import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = authService.onAuthStateChange((user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            await authService.signInWithEmail(email, password);
            toast.success('Signed in successfully!');
        } catch (error: any) {
            const errorCode = error.code;
            let errorMessage = 'Failed to sign in';

            if (errorCode === 'auth/user-not-found') {
                errorMessage = 'No account found with this email';
            } else if (errorCode === 'auth/wrong-password') {
                errorMessage = 'Incorrect password';
            } else if (errorCode === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
            } else if (errorCode === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password';
            } else if (errorCode === 'auth/too-many-requests') {
                errorMessage = 'Too many attempts. Please try again later';
            }

            toast.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signUp = async (email: string, password: string) => {
        try {
            setLoading(true);
            await authService.signUpWithEmail(email, password);
            toast.success('Account created successfully!');
        } catch (error: any) {
            const errorCode = error.code;
            let errorMessage = 'Failed to create account';

            if (errorCode === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please sign in instead.';
                toast.error(errorMessage, {
                    description: 'Click below to switch to sign in',
                });
            } else if (errorCode === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters';
                toast.error(errorMessage);
            } else if (errorCode === 'auth/invalid-email') {
                errorMessage = 'Invalid email address';
                toast.error(errorMessage);
            } else {
                toast.error(errorMessage);
            }

            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        try {
            setLoading(true);
            await authService.signInWithGoogle();
            toast.success('Signed in with Google!');
        } catch (error: any) {
            const errorCode = error.code;
            let errorMessage = 'Failed to sign in with Google';

            if (errorCode === 'auth/popup-closed-by-user') {
                errorMessage = 'Sign in cancelled';
            } else if (errorCode === 'auth/popup-blocked') {
                errorMessage = 'Please allow popups for this site';
            }

            toast.error(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await authService.signOut();
            toast.success('Signed out successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to sign out');
        }
    };

    const value = {
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
