import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { listPlaylists } from '../api';
import { formatPrice } from '../price';

export default function PlaylistListPage() {
    const playlists = useQuery({ queryKey: ['playlists'], queryFn: listPlaylists });

    return (
        <main className='mx-auto max-w-4xl p-8'>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-bold'>Playlists</h1>
                <Link to='/playlists/new' className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'>
                    New Playlist
                </Link>
            </div>

            {playlists.isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {playlists.isError && <p className='mt-4 text-red-600'>{playlists.error.message}</p>}
            {playlists.data?.length === 0 && <p className='mt-4 text-gray-500'>No Playlists yet.</p>}

            <ul className='mt-4 space-y-2'>
                {playlists.data?.map((p) => (
                    <li key={p.id}>
                        <Link to={`/playlists/${p.id}`} className='block rounded border p-3 hover:bg-gray-50'>
                            <span className='font-semibold'>{p.name}</span>
                            <span className='ml-2 text-sm text-gray-500'>
                                {p._count.combos} combo{p._count.combos === 1 ? '' : 's'}
                            </span>
                            {p.isForSale && p.priceCents !== null && (
                                <span className='ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-800'>
                                    For sale · {formatPrice(p.priceCents)}
                                </span>
                            )}
                            {p._count.purchases > 0 && (
                                <span className='ml-2 text-xs text-gray-500'>{p._count.purchases} sold</span>
                            )}
                            {p.description && <p className='text-sm text-gray-600'>{p.description}</p>}
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}