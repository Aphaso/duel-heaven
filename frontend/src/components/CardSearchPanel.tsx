import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchCards } from '../api';
import { allowedSections } from '../deckRules';
import { useDebounce } from '../hooks/useDebounce';
import type { Card, DeckSection } from '../types';
import CardTile from './CardTile';
import Pagination from './Pagination';

const PANEL_SIZE = 12;

const SECTION_LABELS: Record<DeckSection, string> = {
    MAIN: 'Main',
    EXTRA: 'Extra',
    SIDE: 'Side',
};

interface Props {
    copiesByCard: Record<number, number>;
    maxCopies: number;
    busy: boolean;
    onAdd: (card: Card, section: DeckSection) => void;
}

export default function CardSearchPanel({
    copiesByCard,
    maxCopies,
    busy,
    onAdd,
}: Props) {
    const [text, setText] = useState('');
    const search = useDebounce(text.trim(), 300);

    const [pageState, setPageState] = useState ({ search: '', page: 1 });
    const page = pageState.search === search ? pageState.page : 1;

    const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
        queryKey: ['cards-panel', search, page],
        queryFn: () => searchCards({ search, page, limit: PANEL_SIZE}),
        enabled: search.length >= 2,
        placeholderData: keepPreviousData,
    });

    const results = search.length >= 2 ? data : undefined;

    return (
        <div>
            <h2 className='text-xl font-semibold'>Add Cards</h2>
            <input type='search' value={text} onChange={(e) => setText(e.target.value)} placeholder='Card Name...' className='mt-3 w-full rounded border border-gray-300 px-3 py-2'></input>

            {search.length < 2 && <p className='mt-3 text-sm text-gray-500'>Write at least 2 letters.</p>}
            {isLoading && <p className='mt-3 text-sm text-gray-500'>Loading...</p>}
            {isError && <p className='mt-3 text-sm text-red-600'>{error.message}</p>}

            {results && results.items.length === 0 && <p className='mt-3 text-sm'>No Card found.</p>}

            {results && results.items.length > 0 && (
                <>
                    <p className='mt-3 text-xs text-gray-500'>{results.total} cards found</p>
                    <ul className={`mt-1 divide-y ${isPlaceholderData ? 'opacity-50' : ''}`}>
                        {results.items.map((card) => {
                            const copies = copiesByCard[card.id] ?? 0;
                            return (
                                <li key={card.id} className='flex gap-3 py-2'>
                                    <div className='w-16 shrink-0'>
                                        <CardTile card={card}></CardTile>
                                    </div>
                                    <div className='min-w-0 flex-1'>
                                        <p className='truncate text-sm font-medium'>{card.name}</p>
                                        <p className='truncate text-xs text-gray-500'>{card.type}</p>
                                        <div>
                                            {allowedSections(card).map((section) => (
                                                <button key={section} onClick={() => onAdd(card, section)} disabled={busy || copies >= maxCopies} className='rounded border border-gray-300 px-2 py-0.5 text-xs hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40'>
                                                    + {SECTION_LABELS[section]}
                                                </button>
                                            ))}
                                        </div>
                                        {copies > 0 && <p className='mt-1 text-xs text-gray-500'>In the Deck: {copies}</p>}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    <Pagination page={page} totalPages={results.totalPages} disabled={isPlaceholderData} onChange={(next) => setPageState({ search, page: next })}></Pagination>
                </>
            )}
        </div>
    );
}