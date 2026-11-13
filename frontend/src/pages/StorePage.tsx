import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { listStore } from '../api';
import { formatPrice } from '../price';

export default function StorePage() {
    const store = useQuery({ queryKey: ['store'], queryFn: listStore });

    if (store.isPending) return <p className='p-8'>Loading...</p>;
    if (store.isError) return <p className='p-8 text-red-600'>{store.error.message}</p>;

    return (
        <main className='mx-auto max-w-6xl space-y-4 px-8 py-6'>
            <h1 className='text-2xl font-semibold'>Store</h1>
            {store.data.length === 0 && <p className='text-gray-600'>No Playlists for sale yet.</p>}
            <ul className='grid gap-4 sm:grid-cols-2'>
                {store.data.map((p) => (
                    <li key={p.id}>
                        <Link
                            to={`/store/${p.id}`}
                            className='block space-y-1 rounded border border-gray-200 p-4 hover:bg-gray-50'
                        >
                            <div className='flex items-start justify-between gap-3'>
                                <span className='font-semibold'>{p.name}</span>
                                <span className='whitespace-nowrap font-semibold'>
                                    {formatPrice(p.priceCents)}
                                </span>
                            </div>
                            <p className='text-sm text-gray-600'>
                                by @{p.seller} · {p.comboCount} {p.comboCount === 1 ? 'combo' : 'combos'}
                            </p>
                            {p.description && <p className='text-sm'>{p.description}</p>}
                            {p.isOwn && <span className='text-xs text-blue-700'>Yours</span>}
                            {p.purchased && <span className='text-xs text-green-700'>Owned</span>}
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}