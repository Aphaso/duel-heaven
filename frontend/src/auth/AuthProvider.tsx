import { useEffect, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext';
import { fetchMe, logout, type AuthUser } from './authApi';
import { AUTH_EXPIRED_EVENT } from './session';

export function AuthProvider({ children }: { children: ReactNode }) {
    const queryClient = useQueryClient();

    const me = useQuery({
        queryKey: ['me'],
        queryFn: fetchMe,
        retry: false,
        staleTime: Infinity,
    });

    function endSession() {
        // First "me", immediately changing the state, then we throw away everything else.
        // This way, the next user never sees the previous user's data.
        queryClient.setQueryData(['me'], null);
        queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
    }

    function signIn(user: AuthUser) {
        queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
        queryClient.setQueryData(['me'], user);
    }

    async function signOut() {
        try {
            await logout();
        } finally {
            endSession();
        }
    }

    // A 401 on a request (expired session) closes the session
    useEffect(() => {
        const onExpired = () => {
            queryClient.setQueryData(['me'], null);
            queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
        };
        window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
        return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
    }, [queryClient]);

    let status: AuthStatus;
    if (me.isPending) {
        status = 'loading';
    } else if (me.isError) {
        status = 'error';
    } else {
        status = me.data ? 'authenticated' : 'anonymous';
    }

    const value: AuthContextValue = {
        status,
        user: me.data ?? null,
        signIn,
        signOut,
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}