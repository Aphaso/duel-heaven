import { useState, type SyntheticEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router';
import { deleteAccount } from '../auth/authApi';
import { useAuth } from '../auth/useAuth';

export default function AccountPage() {
    const { user, signOut } = useAuth();
    const [typed, setTyped] = useState('');

    const remove = useMutation({
        mutationFn: async (confirmation: string) => {
            await deleteAccount(confirmation);
            await signOut();
        },
    });

    if (!user) {
        return null;
    }

    // What the user must type: same rules as the ones in account-deletion.ts
    const expected = user.username ?? user.email ?? '';
    const matches = expected !== '' && typed.trim().toLowerCase() == expected.toLowerCase();

    function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        if (matches && !remove.isPending) {
            remove.mutate(typed);
        }
    }

    return (
        <main className='mx-auto max-w-2xl space-y-6 px-8 py-6'>
            <h1 className='text-2xl font-semibold'>Account</h1>

            <section className='space-y-1 rounded border border-gray-200 p-4 text-sm'>
                <p>
                    <span className='text-gray-600'>Username:</span> {user.username ?? '-'}
                </p>
                <p>
                    <span className='text-gray-600'>Email:</span> {user.email ?? '-'}
                </p>
                <p>
                    <span className='text-gray-600'>Name:</span> {user.displayName ?? '-'}
                </p>
                <Link to='/account/payments' className='inline-block pt-2 text-blue-700 hover:underline'>
                    Payments settings
                </Link>
            </section>

            <section className='space-y-3 rounded border border-red-300 bg-red-50 p-4'>
                <h2 className='font-semibold text-red-800'>Delete Account</h2>
                <p className='text-sm text-gray-800'>This cannot be undone. What happens:</p>
                <ul className='list-disc space-y-1 pl-5 text-sm text-gray-800'>
                    <li>Your Decks, Combos, WTH? guides and the Playlists nobody bought are erased.</li>
                    <li>The Playlists you bought are removed from your account.</li>
                    <li>
                        Playlists that other people already bought stay available to them, without your
                        name, in the last versione they had.
                    </li>
                    <li>If you connected a payments account, it is closed.</li>
                </ul>
                <form onSubmit={handleSubmit} className='space-y-2'>
                    <label className='block text-sm'>
                        To confirm, type <strong>{expected}</strong>
                        <input
                            value={typed}
                            onChange={(event) => setTyped(event.target.value)}
                            autoComplete='off'
                            className='mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-1'
                        >
                        </input>
                    </label>
                    <button
                        type='submit'
                        disabled={!matches || remove.isPending}
                        className='rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50'
                    >
                        {remove.isPending ? 'Deleting...' : 'Delete my Account'}
                    </button>
                    {remove.isError && <p role='alert' className='text-sm text-red-700'>{remove.error.message}</p>}
                </form>
            </section>
        </main>
    );
}