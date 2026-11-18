import { useState, type SyntheticEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { login } from '../auth/authApi';
import { useAuth } from '../auth/useAuth';
import { GoogleAccess } from '../auth/GoogleAccess';
import { AuthDivider, AuthLayout } from '../layout/AuthLayout';
import { Button } from '../ui/Button';
import { Field, Input, PasswordInput } from '../ui/Field';
import { ErrorMessage } from '../ui/States';
import { linkStyles } from '../ui/styles';

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
        <AuthLayout
            title='Welcome back, Duelist'
            description='Log in to your decks, combos and playlists.'
            footer={<>No account? <Link to='/register' className={linkStyles}>Register</Link></>}
        >
            <form onSubmit={onSubmit} className='space-y-4'>
                <Field label='Email'>
                    {(control) => (
                        <Input
                            {...control}
                            type='email'
                            required
                            autoComplete='email'
                            placeholder='you@example.com'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        ></Input>
                    )}
                </Field>
                <Field label='Password'>
                    {(control) => (
                        <PasswordInput
                            {...control}
                            required
                            autoComplete='current-password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        ></PasswordInput>
                    )}
                </Field>
                {mutation.isError && <ErrorMessage>{mutation.error.message}</ErrorMessage>}
                <Button type='submit' variant='primary' size='lg' loading={mutation.isPending} className='w-full'>
                    {mutation.isPending ? 'Logging in...' : 'Log in'}
                </Button>
            </form>
            <AuthDivider></AuthDivider>
            <GoogleAccess redirectTo={from}></GoogleAccess>
        </AuthLayout>
    );
}