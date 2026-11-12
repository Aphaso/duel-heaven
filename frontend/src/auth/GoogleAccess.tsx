import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { googleLogin } from './authApi';
import { useAuth } from './useAuth';

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
                theme: 'outline',
                size: 'large',
                text: 'continue_with',
                width: 320,
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
        return <p className='text-sm text-gray-500'>Google sign-in is not configured.</p>
    }

    return (
        <div className='space-y-2'>
            <div ref={buttonRef}></div>
            {loadError && <p className='text-sm text-red-600'>{loadError}</p>}
            {mutation.isPending && <p className='text-sm'>Signing in...</p>}
            {mutation.isError && (
                <p role='alert' className='text-sm text-red-600'>
                    {mutation.error.message}
                </p>
            )}
        </div>
    );
}