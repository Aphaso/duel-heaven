import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cardImageUrl, searchCards } from '../api';
import { useDebounce } from '../hooks/useDebounce';
import type { Card } from '../types';

interface Props {
    title: string;
    /** Cards that cannot be picked again (already in the list). */
    disabledIds: Set<number>;
    onPick: (card: Card) => void;
    onClose: () => void;
}

export default function WthCardSearch({ title, disabledIds, onPick, onClose }: Props) {
    const [text, setText] = useState('');
    const query = useDebounce(text, 300).trim();

    const results = useQuery({
        queryKey: ['cards', 'wth-picker', query],
        queryFn: () => searchCards({ search: query, page: 1, limit: 20}),
        enabled: query.length >= 2,
    });
    const cards: Card[] = results.data?.items ?? [];

    return (
        <aside className='rounded border border-blue-300 bg-blue-50 p-3'>
            <div className='mb-2 flex items-center justify-between'>
                <h3 className='text-sm font-semibold'>{title}</h3>
                <button type='button' onClick={onClose} className='text-sm underline'>
                    Close
                </button>
            </div>
            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='Search a card by name (min. 2 letters)'
                autoFocus
                className='w-full rounded border px-2 py-1'
            />
            {results.isError && (
                <p className='mt-2 text-sm text-red-700'>{results.error.message}</p>
            )}
            {query.length >= 2 && results.isSuccess && cards.length === 0 && (
                <p className='mt-2 text-sm text-gray-500'>No cards found.</p>
            )}
            <ul className='mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5'>
                {cards.map((card) => {
                    const disabled = disabledIds.has(card.id);
                    return (
                        <li key={card.id}>
                            <button
                                type='button'
                                disabled={disabled}
                                onClick={() => onPick(card)}
                                title={card.name}
                                className='w-full rounded border bg-white p-1 hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-30'
                            >
                                <img
                                    src={cardImageUrl(card.id)}
                                    alt={card.name}
                                    draggable={false}
                                    className='w-full'
                                />
                                <span className='block truncate text-xs'>{card.name}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}