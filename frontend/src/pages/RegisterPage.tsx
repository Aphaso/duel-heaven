import { useState, type SyntheticEvent} from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { checkUsername, register } from '../auth/authApi';
import { useAuth } from '../auth/useAuth';
import { useDebounce } from '../hooks/useDebounce';

const USERNAME_MIN = 3;
const USERNAME_MAX = 20;

export default function RegisterPage() {
    const { status, signIn } = useAuth();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const candidate = username.trim();
    const debounce = useDebounce(candidate, 400);
    const lengthOk = candidate.length >= USERNAME_MIN && candidate.length <= USERNAME_MAX;

    // Check for availability only after the user stopped typing
    const availability = useQuery({
        queryKey: ['username-available', debounce],
        queryFn: () => checkUsername(debounce),
        enabled: debounce.length >= USERNAME_MIN && debounce.length <= USERNAME_MAX,
        staleTime: 10_000,
    });

    const mutation = useMutation({
        mutationFn: register,
        onSuccess: (result) => {
            signIn(result.user);
            navigate('/', { replace: true });
        },
    });

    if (status === 'authenticated') {
        return <Navigate to="/" replace></Navigate>;
    }

    // Result is valid only if it concerns the name currently in the field
    const checking = lengthOk && (debounce !== candidate || availability.isFetching);
    const taken = lengthOk && !checking && availability.data?.available === false;
    const canSubmit =
        displayName.trim() !== '' &&
        lengthOk &&
        !taken &&
        email.trim() !== '' &&
        password.length >= 8 &&
        !mutation.isPending;
    
    let usernameHint = `${USERNAME_MIN}-${USERNAME_MAX} characters`;
    if (candidate !== '' && !lengthOk) {
        usernameHint = `Must be ${USERNAME_MIN}-${USERNAME_MAX} characters`;
    } else if (checking) {
        usernameHint = 'Checking...';
    } else if (taken) {
        usernameHint = 'Username already taken';
    } else if (lengthOk && availability.data?.available) {
        usernameHint = 'Available';
    }

    function onSubmit(e: SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        mutation.mutate({
            displayName: displayName.trim(),
            username: candidate,
            email: email.trim(),
            password,
        });
    }

    return (
        <main className="mx-auto max-w-sm p-6 space-y-4">
            <h1 className="text-2xl font-semibold">Create Account</h1>
            <form onSubmit={onSubmit} className="space-y-3">
                <label className="block space-y-1">
                    <span className="text-sm">Name</span>
                    <input
                        required
                        autoComplete="name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                    >
                    </input>
                </label>
                <label className="block space-y-1">
                    <span className="text-sm">Username (shown publicly)</span>
                    <input
                        required
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        className="w-full rounded border px-3 py-2"
                    >
                    </input>
                    <span className={`text-xs ${taken ? 'text-red-600' : ''}`}>{usernameHint}</span>
                </label>
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
                        minLength={8}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded border px-3 py-2"
                    >
                    </input>
                    <span className="text-xs">At least 8 characters</span>
                </label>
                {mutation.isError && (
                    <p role="alert" className="text-sm text-red-600">
                        {mutation.error.message}
                    </p>
                )}
                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full rounded border px-3 py-2 disabled:opacity-50"
                >
                    {mutation.isPending ? 'Creating…' : 'Create account'}
                </button>
            </form>
            <p className="text-sm">
                Already registered? <Link to="/login" className="underline">Log in</Link>
            </p>
        </main>
    );
}