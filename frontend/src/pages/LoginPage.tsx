import { useState, type SyntheticEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { login } from '../auth/authApi';
import { useAuth } from '../auth/useAuth';
import { GoogleAccess } from '../auth/GoogleAccess';

export default function LoginPage() {
    const { status, signIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string } | null)?.from ?? '/';

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const mutation = useMutation({
        mutationFn: login,
        onSuccess: (result) => {
            signIn(result.user);
            navigate(from, { replace: true });
        },
    });

    // If the user is already logged we don't have anything to do
    if (status === 'authenticated') {
        return <Navigate to={from} replace></Navigate>;
    }

    function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        mutation.mutate({ email: email.trim(), password });
    }

    return (
        <main className="mx-auto max-w-sm p-6 space-y-4">
            <h1 className="text-2xl font-semibold">Log in</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <label className="block space-y-1">
                    <span className="text-sm">Email</span>
                    <input
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                    >
                    </input>
                </label>
                <label className="block space-y-1">
                    <span className="text-sm">Password</span>
                    <input
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                    >
                    </input>
                </label>
                {mutation.isError && (
                    <p role="alert" className="text-sm text-red-600">
                        {mutation.error.message}
                    </p>
                )}
                <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full rounded border px-3 py-2 disabled:opacity-50"
                >
                    {mutation.isPending ? 'Logging in...' : 'Log in'}
                </button>
            </form>
            <div className='flex items-center gap-3 text-xs text-gray-500'>
                <hr className='flex-1'></hr>or<hr className='flex-1'></hr>
            </div>
            <GoogleAccess redirectTo={from}></GoogleAccess>
            <p className="text-sm">
                No account? <Link to="/register" className="underline">Register</Link>
            </p>
        </main>
    );
}