import { useState, type SyntheticEvent} from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { register } from '../auth/authApi';
import { useAuth } from '../auth/useAuth';
import { useUsernameCheck } from '../hooks/useUsernameCheck';
import { GoogleAccess } from '../auth/GoogleAccess';
import { AuthDivider, AuthLayout } from '../layout/AuthLayout';
import { UsernameInput } from '../components/UsernameInput';
import { usernameHintTone } from '../components/usernameHintTone';
import { Button } from '../ui/Button';
import { Field, Input, PasswordInput } from '../ui/Field';
import { ErrorMessage } from '../ui/States';
import { linkStyles } from '../ui/styles';

export default function RegisterPage() {
    const { status, signIn } = useAuth();
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const { candidate, lengthOk, checking, taken, available, hint: usernameHint } = useUsernameCheck(username);
    const hintTone = usernameHintTone({ candidate, lengthOk, checking, available });

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
    const canSubmit =
        displayName.trim() !== '' &&
        lengthOk &&
        !taken &&
        email.trim() !== '' &&
        password.length >= 8 &&
        !mutation.isPending;
    
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
        <AuthLayout
            title='Create your account'
            description='Join Duel Heaven and start building.'
            footer={<>Already registered? <Link to='/login' className={linkStyles}>Log in</Link></>}
        >
            <form onSubmit={onSubmit} className='space-y-4'>
                <Field label='Name'>
                    {(control) => (
                        <Input
                            {...control}
                            required
                            autoComplete='name'
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        ></Input>
                    )}
                </Field>
                <Field label='Username (shown publicly)' hint={usernameHint} hintTone={hintTone} error={taken ? usernameHint : undefined}>
                    {(control) => (
                        <UsernameInput
                            status={hintTone}
                            {...control}
                            required
                            autoComplete='username'
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase())}
                        ></UsernameInput>
                    )}
                </Field>
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
                <Field label='Password' hint='At least 8 characters' hintTone={password.length >= 8 ? 'success' : 'neutral'}>
                    {(control) => (
                        <PasswordInput
                            {...control}
                            required
                            minLength={8}
                            autoComplete='new-password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        ></PasswordInput>
                    )}
                </Field>
                {mutation.isError && <ErrorMessage>{mutation.error.message}</ErrorMessage>}
                <Button type='submit' variant='primary' size='lg' disabled={!canSubmit} loading={mutation.isPending} className='w-full'>
                    {mutation.isPending ? 'Creating…' : 'Create account'}
                </Button>
            </form>
            <AuthDivider></AuthDivider>
            <GoogleAccess redirectTo='/'></GoogleAccess>
        </AuthLayout>
    );
}