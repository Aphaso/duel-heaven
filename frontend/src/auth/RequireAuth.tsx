import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './useAuth';
import { sectionRoot } from './redirect';
import { Button } from '../ui/Button';
import { AlertIcon } from '../ui/icons';
import { EmptyState, LoadingState } from '../ui/States';

/** Layoute route: show children pages only to logged user */
export function RequireAuth() {
    const { status, signOut } = useAuth();
    const location = useLocation();

    if (status === 'loading') {
        return (
            <div className='grid min-h-dvh place-items-center'>
                <LoadingState />
            </div>
        );
    }
    if (status === 'error') {
        return (
            <div className='grid min-h-dvh place-items-center px-gutter'>
                <EmptyState
                    icon={<AlertIcon />}
                    title="Can't reach the server."
                    description='Check your connection and try again in a moment.'
                    action={<Button variant='primary' onClick={() => void signOut()}>Back to Login</Button>}
                ></EmptyState>
            </div>
        );
    }
    if (status === 'anonymous') {
        // Save where the user wanted to go to, so it can go back there after login
        const from = sectionRoot(location.pathname);
        return <Navigate to="/login" replace state={{ from }}></Navigate>;
    }
    return <Outlet></Outlet>;
}