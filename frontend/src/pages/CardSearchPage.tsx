import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchCards } from '../api';
import CardTile from '../components/CardTile';
import { useDebounce } from '../hooks/useDebounce';

const PAGE_SIZE = 24;

export default function CardSearchPage() {
    const [text, setText] = useState('');
    const search = useDebounce(text.trim(), 300);

    const [pageState, setPageState] = useState({ search: '', page: 1});
    const page = pageState.search === search ? pageState.page : 1;

    function goToPage(next: number) {
        setPageState({ search, page: next });
        window.scrollTo({ top: 0 });
    }

    const { data, isPending, isError, error, isPlaceholderData } = useQuery ({
        queryKey: ['cards', search, page],
        queryFn: () => searchCards({ search, page, limit: PAGE_SIZE }),
        placeholderData: keepPreviousData,
    });

    return (
        <main className='mx-auto max-w-6xl p-8'>
            <h1 className='text-3xl font-bold'>Search Cards</h1>

            <input type='search' value={text} onChange={(e) => setText(e.target.value)} placeholder='Card name...' className='mt-4 full rounded border border-gray-300 px-3 py-2'></input>

            {isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {isError && <p className='mt-4 text-red-600'>{error.message}</p>}

            {data && (
                <>
                    <p className='mt-4 text-sm text-gray-500'>
                        {data.total} found cards
                    </p>

                    {data.items.length === 0 ? (
                        <p className='mt-4'>No card found.</p>
                    ) : (
                        <div className={`mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 ${isPlaceholderData ? 'opacity-50' : ''}`}>
                            {data.items.map((card) => (
                                <CardTile key={card.id} card={card}></CardTile>
                            ))}
                        </div>
                    )}

                    {data.totalPages > 1 && (
                        <nav className='mt-6 flex items-center justify-center gap-4'>
                            <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className='rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40'>
                                Previous
                            </button>
                            <span className='text-sm'>
                                Page {data.page} of {data.totalPages}
                            </span>
                            <button onClick={() => goToPage(page + 1)} disabled={page >= data.totalPages} className='rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40'>
                                Next
                            </button>
                        </nav>
                    )}
                </>
            )}
        </main>
    );
}