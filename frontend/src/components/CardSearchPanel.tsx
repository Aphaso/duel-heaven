import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchCards } from '../api';
import { useDebounce } from '../hooks/useDebounce';
import type { Card, DeckSection } from '../types';
import CardTile from './CardTile';

const PANEL_SIZE = 12;

const SECTION_BUTTONS: { section: DeckSection; label: string }[] = [
    { section: 'MAIN', label: 'Main' },
    { section: 'EXTRA', label: 'Extra' },
    { section: 'SIDE', label: 'Side' },
];

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

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['cards-panel', search],
        queryFn: () => searchCards({ search, page: 1, limit: PANEL_SIZE }),
        enabled: search.length >= 2,
    });

    return (
        <div>
            <h2 className='text-xl font-semibold'>Add Cards</h2>
            <input type='search' value={text} onChange={(e) => setText(e.target.value)} placeholder='Card name...' className='mt-3 w-full rounded border border-gray-300 px-3 py-2'></input>

            {search.length < 2 && <p className='mt-3 text-sm text-gray-500'>Write at least 2 letters.</p>}
            {isLoading && <p className='mt-3 text-sm text-gray-500'>Loading...</p>}
            {isError && <p className='mt-3 text-sm text-red-600'>{error.message}</p>}

            {data && data.items.length === 0 && <p className='mt-3 text-sm'>No Card found.</p>}

            {data && data.items.length > 0 && (
                <>
                    <ul className='mt-3 divide-y'>
                        {data.items.map((card) => {
                            const copies = copiesByCard[card.id] ?? 0;
                            return (
                                <li key={card.id} className='flex gap-3 py-2'>
                                    <div className='w-16 shrink-0'>
                                        <CardTile card={card}></CardTile>
                                    </div>
                                    <div className='min-w-0 flex-1'>
                                        <p className='truncate text-sm font-medium'>{card.name}</p>
                                        <p className='truncate text-xs text-gray-500'>{card.type}</p>
                                        <div className='mt-1 flex gap-1'>
                                            {SECTION_BUTTONS.map(({ section, label }) => (
                                                <button key={section} onClick={() => onAdd(card, section)} disabled={busy || copies >= maxCopies} className='rounded border border-gray-300 px-2 py-0.5 text-xs hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40'>
                                                    + {label}
                                                </button>
                                            ))}
                                        </div>
                                        {copies > 0 && <p className='mt-1 text-xs text-gray-500'>In the Deck: {copies}</p>}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    {data.total > data.items.length && (
                        <p className='mt-2 text-xs text-gray-500'>
                            Currently showing {data.items.length} cards of {data.total} matching cards.
                        </p>
                    )}
                </>
            )}
        </div>
    );
}