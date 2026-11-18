import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { listPurchases } from '../api';
import { formatPrice } from '../price';
import { sellerLabel } from '../seller';
import PlaylistCover from '../components/PlaylistCover';
import { Badge } from '../ui/Badge';
import { LibraryIcon, StoreIcon } from '../ui/icons';
import { Page, PageHeader } from '../ui/PageHeader';
import { EmptyState, ErrorMessage, LoadingState } from '../ui/States';
import { buttonStyles } from '../ui/styles';

export default function PurchasesPage() {
    const purchases = useQuery({ queryKey: ['purchases'], queryFn: listPurchases });

    return (
        <Page>
            <PageHeader
                eyebrow='Library'
                title='Purchased Playlists'
                description='Playlists you bought in the Store. They always include the latest updates from the seller.'
            ></PageHeader>

            {purchases.isPending && <LoadingState></LoadingState>}
            {purchases.isError && <ErrorMessage>{purchases.error.message}</ErrorMessage>}

            {purchases.data && purchases.data.length === 0 && (
                <EmptyState
                    icon={<LibraryIcon />}
                    title='You have not bought anything yet.'
                    description='Find combo playlists made by other Duelists.'
                    action={<Link to='/store' className={buttonStyles({ variant: 'accent' })}><StoreIcon className='size-4' />Visit the store</Link>}
                ></EmptyState>
            )}

            {purchases.data && purchases.data.length > 0 && (
                <ul className='grid gap-3 md:grid-cols-2'>
                    {purchases.data.map((p) => (
                        <li key={p.playlistId}>
                            <Link
                                to={`/purchases/${p.playlistId}`}
                                className='focus-ring group flex h-full gap-4 rounded-panel border border-line bg-surface-raised p-4 shadow-panel transition-colors hover:border-aether-800'
                            >
                                <PlaylistCover seed={p.playlistId} className='size-20 shrink-0' />
                                <span className='min-w-0 flex-1 space-y-1.5'>
                                    <span className='block truncate font-display text-base font-semibold text-ink group-hover:text-primary'>{p.name}</span>
                                    <span className='block text-caption text-ink-subtle'>
                                        by {sellerLabel(p.seller)} · {p.comboCount} {p.comboCount === 1 ? 'combo' : 'combos'}
                                    </span>
                                    <span className='flex flex-wrap items-center gap-2'>
                                        <Badge tone='success'>Owned</Badge>
                                        {p.archived && <Badge tone='warning'>Removed by the seller</Badge>}
                                    </span>
                                    <span className='block text-micro text-ink-faint'>
                                        Paid <span className='numeric text-ink-muted'>{formatPrice(p.amountCents, p.currency)}</span> on{' '}
                                        {new Date(p.purchasedAt).toLocaleDateString('en-GB')}
                                    </span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </Page>
    );
}