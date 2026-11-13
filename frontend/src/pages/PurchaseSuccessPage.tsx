import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { confirmCheckout } from '../api';

export default function PurchaseSuccessPage() {
    const [params] = useSearchParams();
    const sessionId = params.get('session_id');

    // The confirmation is safe to repeat: the backend records a purchase only once
    const confirm = useQuery({
        queryKey: ['checkout-confirm', sessionId],
        queryFn: () => confirmCheckout(sessionId ?? ''),
        enabled: sessionId !== null,
        retry: false,
        staleTime: Infinity,
    });

    if (sessionId === null) {
        return <p className='p-8'>Nothing to confirm here. <Link to='/store' className='underline'>Back to the store</Link></p>;
    }
    if (confirm.isPending) return <p className='p-8'>Confirming your payment...</p>;
    if (confirm.isError) {
        return (
            <div className='space-y-2 p-8'>
                <p className='text-red-600'>{confirm.error.message}</p>
                <Link to='/purchases' className='underline'>Check your purchases</Link>
            </div>
        );
    }

    if (confirm.data.purchased) {
        return (
            <main className='mx-auto max-w-xl space-y-3 px-8 py-6'>
                <h1 className='text-2xl font-semibold'>Thank you!</h1>
                <p>Your payment went through and the Playlist is yours.</p>
                {confirm.data.playlistId && (
                    <Link to={`/purchases/${confirm.data.playlistId}`} className='underline'>
                        Open the playlist
                    </Link>
                )}
            </main>
        );
    }

    return (
        <main className='mx-auto max-w-xl space-y-3 px-8 py-6'>
            <h1 className='text-2xl font-semibold'>Payment not confirmed yet</h1>
            <p>We could not confirm the payment. If you were charged, try again in a moment.</p>
            <button
                type='button'
                onClick={() => void confirm.refetch()}
                disabled={confirm.isFetching}
                className='rounded border border-gray-300 px-3 py-1 disabled:opacity-50'
            >
                Check again
            </button>
        </main>
    );
}