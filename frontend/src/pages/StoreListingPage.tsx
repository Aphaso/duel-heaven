import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { getStoreListing, startCheckout } from '../api';
import { formatPrice } from '../price';
import { sellerLabel } from '../seller';
import PlaylistCover from '../components/PlaylistCover';
import { Button } from '../ui/Button';
import { BoltIcon, CheckIcon, ChevronLeftIcon } from '../ui/icons';
import { Page } from '../ui/PageHeader';
import { Panel } from '../ui/Panel';
import { ErrorMessage, LoadingState, Notice } from '../ui/States';
import { buttonStyles } from '../ui/styles';

export default function StoreListingPage() {
    const { id = '' } = useParams();
    const listing = useQuery({ queryKey: ['store', id], queryFn: () => getStoreListing(id) });

    const buy = useMutation({
        mutationFn: () => startCheckout(id),
        // We leave the app: the payment page belongs to Stripe
        onSuccess: ({ url }) => window.location.assign(url),
    });

    const back = (
        <Link to='/store' className='focus-ring inline-flex items-center gap-1 rounded-control text-sm text-ink-subtle hover:text-accent'>
            <ChevronLeftIcon className='size-4' />
            Store
        </Link>
    );

    if (listing.isPending) {
        return (
            <Page>
                {back}
                <LoadingState></LoadingState>
            </Page>
        );
    }
    if (listing.isError) {
        return (
            <Page>
                {back}
                <ErrorMessage>{listing.error.message}</ErrorMessage>
            </Page>
        );
    }

    const p = listing.data;
    return (
        <Page className='space-y-6'>
            {back}

            <div className='grid gap-8 lg:grid-cols-[20rem_minmax(0,1fr)]'>
                {/* Cover and purchase box */}
                <aside className='space-y-4 lg:sticky lg:top-[calc(var(--spacing-topbar)+1rem)] lg:self-start'>
                    <PlaylistCover seed={p.id} className='w-full max-w-80 rounded-panel shadow-overlay' />
                    <div className='holo-border space-y-4 rounded-panel p-5 shadow-panel'>
                        <div>
                            <p className='label text-ink-subtle'>Price</p>
                            <p className='numeric text-display text-accent'>{formatPrice(p.priceCents)}</p>
                        </div>
                        {p.isOwn ? (
                            <Notice tone='info'>This is your Playlist.</Notice>
                        ) : p.purchased ? (
                            <Link to={`/purchases/${p.id}`} className={buttonStyles({ variant: 'primary', size: 'lg', className: 'w-full' })}>
                                <CheckIcon className='size-4' />
                                You own this Playlist: open it
                            </Link>
                        ) : (
                            <Button variant='accent' size='lg' onClick={() => buy.mutate()} loading={buy.isPending} className='w-full'>
                                {buy.isPending ? 'Redirecting...' : `Buy for ${formatPrice(p.priceCents)}`}
                            </Button>
                        )}
                        {buy.isError && <ErrorMessage>{buy.error.message}</ErrorMessage>}
                        <p className='text-caption text-ink-faint'>
                            You see the full combos after buying. Updates from the seller are included.
                        </p>
                    </div>
                </aside>

                <div className='min-w-0 space-y-6'>
                    <header className='space-y-2'>
                        <p className='label text-accent'>Playlist</p>
                        <h1 className='font-display text-title break-words text-ink'>{p.name}</h1>
                        <p className='text-sm text-ink-subtle'>by <span className='font-medium text-ink'>{sellerLabel(p.seller)}</span></p>
                        {p.description && <p className='pt-2 whitespace-pre-line text-ink-muted'>{p.description}</p>}
                    </header>

                    <Panel title={<>Included combos <span className='numeric text-ink'>({p.combos.length})</span></>} flush>
                        <ol className='divide-y divide-line'>
                            {p.combos.map((c, i) => (
                                <li key={i} className='flex items-center gap-4 px-panel py-3'>
                                    <span className='numeric w-6 shrink-0 text-center text-sm text-ink-faint'>{i + 1}</span>
                                    <BoltIcon className='size-4 shrink-0 text-secondary' />
                                    <span className='min-w-0 flex-1 truncate text-sm font-medium text-ink'>{c.name}</span>
                                    <span className='numeric shrink-0 text-caption text-ink-subtle'>{c.stepCount} steps</span>
                                </li>
                            ))}
                        </ol>
                    </Panel>
                </div>
            </div>
        </Page>
    );
}