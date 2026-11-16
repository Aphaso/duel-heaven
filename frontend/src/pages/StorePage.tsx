import type { SyntheticEvent } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router';
import { listStore } from '../api';
import { formatPrice } from '../price';
import Pagination from '../components/Pagination';

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
        <main className='mx-auto max-w-6xl space-y-4 px-8 py-6'>
            <h1 className='text-2xl font-semibold'>Store</h1>

            {/* When the URL changes the field starts again from the new value */}
            <form key={q} onSubmit={handleSearch} className='flex gap-2'>
                <input
                    name='q'
                    defaultValue={q}
                    maxLength={SEARCH_MAX_LENGTH}
                    placeholder='Search by Playlist or Seller...'
                    aria-label='Search the Store'
                    className='min-w-0 flex-q rounded border border-gray-300 px-3 py-1'
                >
                </input>
                <button type='submit' className='rounded border border-gray-300 px-3 py-1 hover:bg-gray-50'>
                    Search
                </button>
                {q !== '' && (
                    <button
                        type='button'
                        onClick={() => go({ q: '', page: 1 })}
                        className='rounded border border-gray-300 px-3 py-1 hover:bg-gray-50'
                    >
                        Clear
                    </button>
                )}
            </form>

            {store.isPending && <p>Loading...</p>}
            {store.isError && <p className='text-red-600'>{store.error.message}</p>}

            {store.data && (
                <>
                    {store.data.items.length === 0 && (
                        <p className='text-gray-600'>
                            {q ? `No playlists match "${q}".` : 'No Playlists for sale yet.'}
                        </p>
                    )}
                    <ul className={`grid gap-4 sm:grid-cols-2 ${store.isPlaceholderData ? 'opacity-60' : ''}`}>
                        {store.data.items.map((p) => (
                            <li key={p.id} className='rounded border border-gray-200'>
                                <Link to={`/store/${p.id}`} className='block space-y-1 rounded-t p-4 hover:bg-gray-50'>
                                    <div className='flex items-start justify-between gap-3'>
                                        <span className='font-semibold'>{p.name}</span>
                                        <span className='whitespace-nowrap font-semibold'>
                                            {formatPrice(p.priceCents)}
                                        </span>
                                    </div>
                                    {p.description && <p className='text-sm'>{p.description}</p>}
                                </Link>
                                <div className='flex flex-wrap items-center gap-2 px-4 pb-3 text-sm text-gray-600'>
                                    {p.seller ? (
                                        <button
                                            type='button'
                                            title={`Show the Playlists of @${p.seller}`}
                                            onClick={() => go({ q: p.seller ?? '', page: 1 })}
                                            className='text-blue-700 hover:underline'
                                        >
                                            by @{p.seller}
                                        </button>
                                    ) : (
                                        <span>by Unknown Duelist</span>
                                    )}
                                    <span>
                                        · {p.comboCount} {p.comboCount === 1 ? 'Combo' : 'Combos'}
                                    </span>
                                    {p.isOwn && <span className='text-xs text-blue-700'>Yours</span>}
                                    {p.purchased && <span className='text-xs text-green-700'>Owned</span>}
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
                </>
            )}
        </main>
    );
}