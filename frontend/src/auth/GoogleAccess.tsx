import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { googleLogin } from './authApi';
import { useAuth } from './useAuth';
import { ErrorMessage, LoadingState } from '../ui/States';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

let scriptPromise: Promise<void> | null = null;

/** Load the Google script only once */
function loadGoogleScript(): Promise<void> {
    scriptPromise ??= new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => {
            scriptPromise = null; // Allows to try again
            reject(new Error('Could not load Google sign-in'));
        };
        document.head.appendChild(script);
    });
    return scriptPromise;
}

/** Continue with Google: handles both access and new registration */
export function GoogleAccess({ redirectTo }: { redirectTo: string }) {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const buttonRef = useRef<HTMLDivElement>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    const mutation = useMutation({
        mutationFn: googleLogin,
        onSuccess: (result) => {
            if (result.status === 'authenticated') {
                signIn(result.user);
                navigate(redirectTo, { replace: true });
            } else {
                // New user: missing username. Token stays in memory, not in the URL
                navigate('/register/google', {
                    state: {
                        signupToken: result.signupToken,
                        name: result.name,
                        email: result.email,
                    },
                });
            }
        },
    });
    const { mutate } = mutation;

    useEffect(() => {
        if (!CLIENT_ID) return;
        let cancelled = false;

        loadGoogleScript().then(() => {
            if (cancelled || !buttonRef.current || !window.google) {
                return;
            }
            window.google.accounts.id.initialize({
                client_id: CLIENT_ID,
                callback: (response) => mutate(response.credential),
            });
            window.google.accounts.id.renderButton(buttonRef.current, {
                theme: 'filled_black',
                size: 'large',
                text: 'continue_with',
                // Google accepts a width between 200 and 400 px: it follows the container
                width: Math.min(400, Math.max(200, buttonRef.current.offsetWidth)),
            });
        }).catch((e: Error) => {
            if (!cancelled) {
                setLoadError(e.message);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [mutate]);

    if (!CLIENT_ID) {
        return <p className='text-center text-caption text-ink-faint'>Google sign-in is not configured.</p>
    }

    return (
        <div className='space-y-3'>
            <div ref={buttonRef} className='flex min-h-10 w-full justify-center [color-scheme:light]'></div>
            {loadError && <ErrorMessage>{loadError}</ErrorMessage>}
            {mutation.isPending && <LoadingState label='Signing in...' className='justify-center py-1' />}
            {mutation.isError && <ErrorMessage>{mutation.error.message}</ErrorMessage>}
        </div>
    );
}