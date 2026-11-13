import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { getStoreListing, startCheckout } from '../api';
import { formatPrice } from '../price';

export default function StoreListingPage() {
    const { id = '' } = useParams();
    const listing = useQuery({ queryKey: ['store', id], queryFn: () => getStoreListing(id) });

    const buy = useMutation({
        mutationFn: () => startCheckout(id),
        // We leave the app: the payment page belongs to Stripe
        onSuccess: ({ url }) => window.location.assign(url),
    });

    if (listing.isPending) return <p className='p-8'>Loading...</p>;
    if (listing.isError) {
        return (
            <div className='space-y-2 p-8'>
                <p className='text-red-600'>{listing.error.message}</p>
                <Link to='/store' className='underline'>Back to the store</Link>
            </div>
        );
    }

    const p = listing.data;
    return (
        <main className='mx-auto max-w-3xl space-y-4 px-8 py-6'>
            <Link to='/store' className='text-sm underline'>← Store</Link>
            <h1 className='text-2xl font-semibold'>{p.name}</h1>
            <p className='text-sm text-gray-600'>by @{p.seller}</p>
            {p.description && <p>{p.description}</p>}

            <section className='space-y-1'>
                <h2 className='font-semibold'>
                    Included combos ({p.combos.length})
                </h2>
                <ul className='list-disc pl-6 text-sm'>
                    {p.combos.map((c, i) => (
                        <li key={i}>
                            {c.name} <span className='text-gray-500'>· {c.stepCount} steps</span>
                        </li>
                    ))}
                </ul>
                <p className='text-xs text-gray-500'>
                    You see the full combos after buying. Updates from the seller are included.
                </p>
            </section>

            <div className='flex items-center gap-4'>
                {p.isOwn ? (
                    <span className='text-sm text-gray-600'>This is your Playlist.</span>
                ) : p.purchased ? (
                    <Link to={`/purchases/${p.id}`} className='underline'>
                        You own this Playlist: open it
                    </Link>
                ) : (
                    <button
                        type='button'
                        onClick={() => buy.mutate()}
                        disabled={buy.isPending}
                        className='rounded border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-50 disabled:opacity-50'
                    >
                        {buy.isPending ? 'Redirecting...' : `Buy for ${formatPrice(p.priceCents)}`}
                    </button>
                )}
            </div>
            {buy.isError && <p role='alert' className='text-sm text-red-600'>{buy.error.message}</p>}
        </main>
    );
}