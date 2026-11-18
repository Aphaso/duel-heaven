import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { confirmCheckout } from '../api';
import { Button } from '../ui/Button';
import { AlertIcon, CheckIcon, StoreIcon } from '../ui/icons';
import { Page } from '../ui/PageHeader';
import { EmptyState, ErrorMessage, LoadingState } from '../ui/States';
import { buttonStyles } from '../ui/styles';

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

    let content;
    if (sessionId === null) {
        content = (
            <EmptyState
                icon={<StoreIcon />}
                title='Nothing to confirm here.'
                action={<Link to='/store' className={buttonStyles({ variant: 'accent' })}>Back to the store</Link>}
            ></EmptyState>
        );
    } else if (confirm.isPending) {
        content = <LoadingState label='Confirming your payment...' className='justify-center py-16'></LoadingState>;
    } else if (confirm.isError) {
        content = (
            <div className='space-y-4'>
                <ErrorMessage>{confirm.error.message}</ErrorMessage>
                <Link to='/purchases' className={buttonStyles()}>Check your purchases</Link>
            </div>
        );
    } else if (confirm.data.purchased) {
        content = (
            <div className='holo-border relative space-y-4 overflow-hidden rounded-panel p-8 text-center shadow-overlay'>
                <div aria-hidden='true' className='pointer-events-none absolute -top-20 left-1/2 size-60 -translate-x-1/2 rounded-full bg-relic-400/15 blur-3xl'></div>
                <span className='relative mx-auto grid size-16 place-items-center rounded-full bg-success/15 text-success shadow-[0_0_30px_rgb(47_208_138/0.35)]'>
                    <CheckIcon className='size-8' />
                </span>
                <h1 className='relative font-display text-title text-ink'>Thank you!</h1>
                <p className='relative text-ink-muted'>Your payment went through and the Playlist is yours.</p>
                {confirm.data.playlistId && (
                    <Link to={`/purchases/${confirm.data.playlistId}`} className={buttonStyles({ variant: 'primary', size: 'lg', className: 'relative' })}>
                        Open the playlist
                    </Link>
                )}
            </div>
        );
    } else {
        content = (
            <div className='space-y-4 rounded-panel border border-warning/40 bg-warning/5 p-8 text-center'>
                <span className='mx-auto grid size-14 place-items-center rounded-full bg-warning/15 text-warning'>
                    <AlertIcon className='size-7' />
                </span>
                <h1 className='font-display text-title text-ink'>Payment not confirmed yet</h1>
                <p className='text-ink-muted'>We could not confirm the payment. If you were charged, try again in a moment.</p>
                <Button onClick={() => void confirm.refetch()} disabled={confirm.isFetching} loading={confirm.isFetching}>
                    Check again
                </Button>
            </div>
        );
    }

    return <Page width='compact'>{content}</Page>;
}