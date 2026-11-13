import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { listPurchases } from '../api';
import { formatPrice } from '../price';

export default function PurchasesPage() {
    const purchases = useQuery({ queryKey: ['purchases'], queryFn: listPurchases });

    if (purchases.isPending) return <p className='p-8'>Loading...</p>;
    if (purchases.isError) return <p className='p-8 text-red-600'>{purchases.error.message}</p>;

    return (
        <main className='mx-auto max-w-6xl space-y-4 px-8 py-6'>
            <h1 className='text-2xl font-semibold'>Purchased Playlists</h1>
            {purchases.data.length === 0 && (
                <p className='text-gray-600'>
                    You have not bought anything yet. <Link to='/store' className='underline'>Visit the store</Link>.
                </p>
            )}
            <ul className='space-y-3'>
                {purchases.data.map((p) => (
                    <li key={p.playlistId}>
                        <Link
                            to={`/purchases/${p.playlistId}`}
                            className='block space-y-1 rounded border border-gray-200 p-4 hover:bg-gray-50'
                        >
                            <div className='flex items-center justify-between gap-3'>
                                <span className='font-semibold'>{p.name}</span>
                                {p.archived && (
                                    <span className='rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800'>
                                        Removed by the seller
                                    </span>
                                )}
                            </div>
                            <p className='text-sm text-gray-600'>
                                by @{p.seller} · {p.comboCount} {p.comboCount === 1 ? 'combo' : 'combos'} ·
                                paid {formatPrice(p.amountCents, p.currency)} on{' '}
                                {new Date(p.purchasedAt).toLocaleDateString('en-GB')}
                            </p>
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}