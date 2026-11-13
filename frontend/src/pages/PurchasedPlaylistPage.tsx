import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { getPurchase } from '../api';

export default function PurchasedPlaylistPage() {
    const { playlistId = '' } = useParams();
    const purchase = useQuery({
        queryKey: ['purchases', playlistId],
        queryFn: () => getPurchase(playlistId),
    });

    if (purchase.isPending) return <p className='p-8'>Loading...</p>;
    if (purchase.isError) {
        return (
            <div className='space-y-2 p-8'>
                <p className='text-red-600'>{purchase.error.message}</p>
                <Link to='/purchases' className='underline'>Back to your purchases</Link>
            </div>
        );
    }

    const p = purchase.data;
    return (
        <main className='mx-auto max-w-3xl space-y-4 px-8 py-6'>
            <Link to='/purchases' className='text-sm underline'>← Purchased Playlists</Link>
            <h1 className='text-2xl font-semibold'>{p.name}</h1>
            <p className='text-sm text-gray-600'>by @{p.seller}</p>
            {p.archived && (
                <p className='rounded bg-amber-50 p-3 text-sm text-amber-800'>
                    The seller removed this Playlist. You keep the last version they published.
                </p>
            )}
            {p.description && <p>{p.description}</p>}

            <ul className='space-y-2'>
                {p.combos.map((c) => (
                    <li key={c.id}>
                        <Link
                            to={`/purchases/${p.playlistId}/combos/${c.id}`}
                            className='block rounded border border-gray-200 p-3 hover:bg-gray-50'
                        >
                            <span className='font-semibold'>{c.name}</span>
                            <span className='text-sm text-gray-500'> · {c.stepCount} steps</span>
                            {c.description && <p className='text-sm text-gray-600'>{c.description}</p>}
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}