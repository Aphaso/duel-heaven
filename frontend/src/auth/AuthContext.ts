import { createContext } from 'react';
import type { AuthUser } from './authApi';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error';

export type AuthContextValue = {
    status: AuthStatus;
    user: AuthUser | null;
    // To be called after a successfull login/registration
    signIn: (user: AuthUser) => void;
    signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);