import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { getPurchase } from '../api';
import { sellerLabel } from '../seller';
import PlaylistCover from '../components/PlaylistCover';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '../ui/icons';
import { Page } from '../ui/PageHeader';
import { Panel } from '../ui/Panel';
import { ErrorMessage, LoadingState, Notice } from '../ui/States';

export default function PurchasedPlaylistPage() {
    const { playlistId = '' } = useParams();
    const purchase = useQuery({
        queryKey: ['purchases', playlistId],
        queryFn: () => getPurchase(playlistId),
    });

    const back = (
        <Link to='/purchases' className='focus-ring inline-flex items-center gap-1 rounded-control text-sm text-ink-subtle hover:text-primary'>
            <ChevronLeftIcon className='size-4' />
            Purchased Playlists
        </Link>
    );

    if (purchase.isPending) {
        return (
            <Page>
                {back}
                <LoadingState></LoadingState>
            </Page>
        );
    }
    if (purchase.isError) {
        return (
            <Page>
                {back}
                <ErrorMessage>{purchase.error.message}</ErrorMessage>
            </Page>
        );
    }

    const p = purchase.data;
    return (
        <Page className='space-y-6'>
            {back}
            <header className='flex flex-wrap items-end gap-5'>
                <PlaylistCover seed={p.playlistId} className='size-24 shrink-0 shadow-overlay sm:size-32' />
                <div className='min-w-0 flex-1 space-y-2'>
                    <p className='label text-success'>Owned Playlist</p>
                    <h1 className='font-display text-title break-words text-ink'>{p.name}</h1>
                    <p className='text-sm text-ink-subtle'>by <span className='font-medium text-ink'>{sellerLabel(p.seller)}</span></p>
                </div>
            </header>
            {p.archived && (
                <Notice>The seller removed this Playlist or their account. You keep the last version they published.</Notice>
            )}
            {p.description && <p className='whitespace-pre-line text-ink-muted'>{p.description}</p>}

            <Panel title={<>Combos <span className='numeric text-ink'>({p.combos.length})</span></>} flush>
                <ol className='divide-y divide-line'>
                    {p.combos.map((c, i) => (
                        <li key={c.id}>
                            <Link
                                to={`/purchases/${p.playlistId}/combos/${c.id}`}
                                className='focus-ring group flex items-center gap-4 px-panel py-3 transition-colors hover:bg-surface-hover'
                            >
                                <span className='numeric w-6 shrink-0 text-center text-sm text-ink-faint group-hover:hidden'>{i + 1}</span>
                                <PlayIcon className='hidden size-4 w-6 shrink-0 text-primary group-hover:block' />
                                <span className='min-w-0 flex-1'>
                                    <span className='block truncate text-sm font-semibold text-ink group-hover:text-primary'>{c.name}</span>
                                    {c.description && <span className='block truncate text-caption text-ink-subtle'>{c.description}</span>}
                                </span>
                                <span className='numeric shrink-0 text-caption text-ink-subtle'>{c.stepCount} steps</span>
                                <ChevronRightIcon className='size-4 shrink-0 text-ink-faint' />
                            </Link>
                        </li>
                    ))}
                </ol>
            </Panel>
        </Page>
    );
}