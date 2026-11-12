import { useState, type SyntheticEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { googleComplete } from '../auth/authApi';
import { useAuth } from '../auth/useAuth';
import { useUsernameCheck } from '../hooks/useUsernameCheck';

type SignupState = { signupToken: string; name: string; email: string };

export default function GoogleSignupPage() {
    const { status, signIn } = useAuth();
    const navigate = useNavigate();
    const state = useLocation().state as SignupState | null;

    const [username, setUsername] = useState('');
    const { candidate, lengthOk, taken, hint } = useUsernameCheck(username);

    const mutation = useMutation({
        mutationFn: googleComplete,
        onSuccess: (result) => {
            signIn(result.user);
            navigate('/', { replace: true });
        },
    });

    if (status === 'authenticated') {
        return <Navigate to="/" replace></Navigate>;
    }
    // Reloading the pages gets you back to the login
    if (!state?.signupToken) {
        return <Navigate to="/login" replace></Navigate>;
    }

    const canSubmit = lengthOk && !taken && !mutation.isPending;

    function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        mutation.mutate({ signupToken: state!.signupToken, username: candidate });
    }

    return (
        <main className='mx-auto max-w-sm p-6 space-y-4'>
            <h1 className='text-2xl font-semibold'>Choose your Username</h1>
            <p className='text-sm text-gray-600'>
                Signing up as <strong>{state.name}</strong> ({state.email}). Your username is what other people will see.
            </p>
            <form onSubmit={onSubmit} className='space-y-3'>
                <label className='block space-y-1'>
                    <span className='text-sm'>Username</span>
                    <input
                        required
                        autoFocus
                        autoComplete='off'
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        className='w-full rounded border px-3 py-2'
                    >
                    </input>
                    <span className={`text-xs ${taken ? 'text-red-600' : ''}`}>{hint}</span>
                </label>
                {mutation.isError && (
                    <p role='alert' className='text-sm text-red-600'>
                        {mutation.error.message}
                    </p>
                )}
                <button
                    type='submit'
                    disabled={!canSubmit}
                    className='w-full rounded border px-3 py-2 disabled:opacity-50'
                >
                    {mutation.isPending ? 'Creating...' : 'Create Account'}
                </button>
            </form>
            <p className='text-sm'>
                <Link to='/login' className='underline'>Cancel</Link>
            </p>
        </main>
    );
}