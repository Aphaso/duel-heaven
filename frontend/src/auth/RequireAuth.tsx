import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from './useAuth';
import { sectionRoot } from './redirect';

/** Layoute route: show children pages only to logged user */
export function RequireAuth() {
    const { status, signOut } = useAuth();
    const location = useLocation();

    if (status === 'loading') {
        return <p className='p-6'>Loading...</p>
    }
    if (status === 'error') {
        return (
            <div className='p-6 space-y-3'>
                <p>Can't reach the server.</p>
                <button className='rounded border px-3 py-1' onClick={() => void signOut()}>
                    Back to Login
                </button>
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