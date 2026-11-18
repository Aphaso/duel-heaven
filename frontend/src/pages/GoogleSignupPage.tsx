import { useState, type SyntheticEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { googleComplete } from '../auth/authApi';
import { useAuth } from '../auth/useAuth';
import { useUsernameCheck } from '../hooks/useUsernameCheck';
import { AuthLayout } from '../layout/AuthLayout';
import { UsernameInput } from '../components/UsernameInput';
import { usernameHintTone } from '../components/usernameHintTone';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { ErrorMessage } from '../ui/States';
import { linkStyles } from '../ui/styles';

type SignupState = { signupToken: string; name: string; email: string };

export default function GoogleSignupPage() {
    const { status, signIn } = useAuth();
    const navigate = useNavigate();
    const state = useLocation().state as SignupState | null;

    const [username, setUsername] = useState('');
    const { candidate, lengthOk, checking, taken, available, hint } = useUsernameCheck(username);
    const hintTone = usernameHintTone({ candidate, lengthOk, checking, available });

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
        <AuthLayout
            title='Choose your Username'
            description={
                <>
                    Signing up as <strong className='font-semibold text-ink'>{state.name}</strong> ({state.email}). Your username is what other people will see.
                </>
            }
            footer={<Link to='/login' className={linkStyles}>Cancel</Link>}
        >
            <form onSubmit={onSubmit} className='space-y-4'>
                <Field label='Username' hint={hint} hintTone={hintTone} error={taken ? hint : undefined}>
                    {(control) => (
                        <UsernameInput
                            status={hintTone}
                            {...control}
                            required
                            autoFocus
                            autoComplete='off'
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        ></UsernameInput>
                    )}
                </Field>
                {mutation.isError && <ErrorMessage>{mutation.error.message}</ErrorMessage>}
                <Button type='submit' variant='primary' size='lg' disabled={!canSubmit} loading={mutation.isPending} className='w-full'>
                    {mutation.isPending ? 'Creating...' : 'Create Account'}
                </Button>
            </form>
        </AuthLayout>
    );
}