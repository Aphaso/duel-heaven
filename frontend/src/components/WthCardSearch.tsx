import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchCards } from '../api';
import { useDebounce } from '../hooks/useDebounce';
import type { Card } from '../types';
import CardTile from './CardTile';
import { Button } from '../ui/Button';
import { CloseIcon } from '../ui/icons';
import { SearchInput } from '../ui/SearchInput';
import { ErrorMessage } from '../ui/States';

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
        <aside className='animate-rise-in space-y-3 rounded-panel border border-aether-900 bg-aether-950/30 p-4'>
            <div className='flex items-center justify-between'>
                <h3 className='label text-aether-300'>{title}</h3>
                <Button size='sm' variant='ghost' onClick={onClose}>
                    <CloseIcon className='size-4' />
                    Close
                </Button>
            </div>
            <SearchInput
                value={text}
                onValueChange={setText}
                loading={results.isFetching}
                placeholder='Search a card by name (min. 2 letters)'
                aria-label='Search a card by name'
                autoFocus
            />
            {results.isError && <ErrorMessage>{results.error.message}</ErrorMessage>}
            {query.length >= 2 && results.isSuccess && cards.length === 0 && (
                <p className='text-sm text-ink-subtle'>No cards found.</p>
            )}
            {cards.length > 0 && (
                <ul className='grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6'>
                    {cards.map((card) => {
                        const disabled = disabledIds.has(card.id);
                        return (
                            <li key={card.id}>
                                <button
                                    type='button'
                                    disabled={disabled}
                                    onClick={() => onPick(card)}
                                    title={card.name}
                                    className='focus-ring group w-full rounded-card text-left disabled:cursor-not-allowed disabled:opacity-30'
                                >
                                    <div className='rounded-card transition-[transform,box-shadow] group-enabled:group-hover:-translate-y-1 group-enabled:group-hover:shadow-glow-primary'>
                                        <CardTile card={card}></CardTile>
                                    </div>
                                    <span className='mt-1 block truncate text-micro text-ink-muted'>{card.name}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </aside>
    );
}