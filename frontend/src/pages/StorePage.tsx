import type { SyntheticEvent } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { listStore } from '../api';
import { formatPrice } from '../price';
import Pagination from '../components/Pagination';
import PlaylistCover from '../components/PlaylistCover';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Field';
import { SearchIcon, StoreIcon } from '../ui/icons';
import { Page } from '../ui/PageHeader';
import { EmptyState, ErrorMessage, LoadingState } from '../ui/States';
import { cn } from '../ui/styles';

// Here too, if the backend changes this also needs to change
const SEARCH_MAX_LENGTH = 50;

export default function StorePage() {
    // Search and page live in the URL: can go back using the browser back button, reload keeps them and links can be shared
    const [searchParams, setSearchParams] = useSearchParams();
    const q = searchParams.get('q') ?? '';
    const parsedPage = Number.parseInt(searchParams.get('page') ?? '', 10);
    const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

    const store = useQuery({
        queryKey: ['store', 'list', q, page],
        queryFn: () => listStore({ q, page }),
        // Keep showing the previous results while the next ones load
        placeholderData: keepPreviousData,
    });

    function go(next: { q: string; page: number }) {
        const params = new URLSearchParams();
        if (next.q) {
            params.set('q', next.q);
        }
        if (next.page > 1) {
            params.set('page', String(next.page));
        }
        setSearchParams(params);
    }

    function handleSearch(event: SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get('q');
        go({ q: typeof value === 'string' ? value.trim() : '', page: 1 });
    }

    return (
        <Page>
            {/* Store hero: gold accent, the search lives here */}
            <section className='relative overflow-hidden rounded-panel border border-relic-900 bg-gradient-to-br from-relic-950 via-surface-raised to-arcane-950 p-6 shadow-panel sm:p-8'>
                <div aria-hidden='true' className='pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-relic-400/10 blur-3xl'></div>
                <div className='relative max-w-2xl space-y-4'>
                    <div className='space-y-1'>
                        <p className='label text-accent'>Marketplace</p>
                        <h1 className='font-display text-display text-ink'>Store</h1>
                        <p className='text-sm text-ink-muted'>Combo playlists made by other Duelists. Buy once, get every update from the seller.</p>
                    </div>
                    {/* When the URL changes the field starts again from the new value */}
                    <form key={q} onSubmit={handleSearch} role='search' className='flex flex-col gap-2 sm:flex-row'>
                        <div className='relative min-w-0 flex-1'>
                            <SearchIcon className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-subtle' />
                            <Input
                                name='q'
                                defaultValue={q}
                                maxLength={SEARCH_MAX_LENGTH}
                                placeholder='Search by Playlist or Seller...'
                                aria-label='Search the Store'
                                className='h-11 pl-9'
                            >
                            </Input>
                        </div>
                        <div className='flex gap-2'>
                            <Button type='submit' variant='accent' className='h-11 flex-1 sm:flex-none'>
                                Search
                            </Button>
                            {q !== '' && (
                                <Button variant='ghost' onClick={() => go({ q: '', page: 1 })} className='h-11'>
                                    Clear
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            </section>

            {store.isPending && <LoadingState></LoadingState>}
            {store.isError && <ErrorMessage>{store.error.message}</ErrorMessage>}

            {store.data && (
                <section aria-label='Playlists for sale' className='space-y-4'>
                    {q && store.data.items.length > 0 && (
                        <p className='text-sm text-ink-subtle'>
                            Results for <span className='text-ink'>“{q}”</span>
                        </p>
                    )}
                    {store.data.items.length === 0 && (
                        <EmptyState
                            icon={<StoreIcon />}
                            title={q ? `No playlists match "${q}".` : 'No Playlists for sale yet.'}
                            description={q ? 'Try another name or the username of a seller.' : 'Be the first: put one of your playlists on sale from its Edit page.'}
                        ></EmptyState>
                    )}
                    <ul className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3 transition-opacity', store.isPlaceholderData && 'opacity-60')}>
                        {store.data.items.map((p) => (
                            <li key={p.id} className='group flex flex-col overflow-hidden rounded-panel border border-line bg-surface-raised shadow-panel transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-relic-800 hover:shadow-glow-accent'>
                                <Link to={`/store/${p.id}`} className='focus-ring flex flex-1 gap-4 p-4'>
                                    <PlaylistCover seed={p.id} className='size-20 shrink-0' />
                                    <span className='min-w-0 flex-1 space-y-1'>
                                        <span className='line-clamp-2 block font-display text-base font-semibold text-ink'>{p.name}</span>
                                        {p.description && <span className='line-clamp-2 block text-sm text-ink-subtle'>{p.description}</span>}
                                        <span className='flex flex-wrap gap-1.5 pt-1'>
                                            {p.isOwn && <Badge tone='primary'>Yours</Badge>}
                                            {p.purchased && <Badge tone='success'>Owned</Badge>}
                                        </span>
                                    </span>
                                </Link>
                                <div className='flex items-center justify-between gap-3 border-t border-line bg-surface-sunken/50 px-4 py-3'>
                                    <span className='flex min-w-0 flex-wrap items-center gap-x-2 text-caption text-ink-subtle'>
                                        {p.seller ? (
                                            <button
                                                type='button'
                                                title={`Show the Playlists of @${p.seller}`}
                                                onClick={() => go({ q: p.seller ?? '', page: 1 })}
                                                className='focus-ring truncate rounded font-medium text-primary hover:underline'
                                            >
                                                by @{p.seller}
                                            </button>
                                        ) : (
                                            <span>by Unknown Duelist</span>
                                        )}
                                        <span>
                                            · {p.comboCount} {p.comboCount === 1 ? 'Combo' : 'Combos'}
                                        </span>
                                    </span>
                                    <span className='numeric shrink-0 text-heading text-accent'>{formatPrice(p.priceCents)}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                    <Pagination
                        page={store.data.page}
                        totalPages={store.data.totalPages}
                        disabled={store.isPlaceholderData}
                        onChange={(next) => go({ q, page: next })}
                    >
                    </Pagination>
                </section>
            )}
        </Page>
    );
}