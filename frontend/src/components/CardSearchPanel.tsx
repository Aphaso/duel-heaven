import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchCards } from '../api';
import { allowedSections } from '../deckRules';
import { useDebounce } from '../hooks/useDebounce';
import type { Card, DeckSection } from '../types';
import CardTile from './CardTile';
import Pagination from './Pagination';
import { frameTextClass } from './cardStyles';
import { ZONE_STYLES } from './deckZones';
import { PlusIcon } from '../ui/icons';
import { Panel } from '../ui/Panel';
import { SearchInput } from '../ui/SearchInput';
import { ErrorMessage } from '../ui/States';
import { cn } from '../ui/styles';

const PANEL_SIZE = 12;

const SECTION_LABELS: Record<DeckSection, string> = {
    MAIN: 'Main',
    EXTRA: 'Extra',
    SIDE: 'Side',
};

interface Props {
    copiesByCard: Record<number, number>;
    busy: boolean;
    canAdd: (card: Card, section: DeckSection) => boolean;
    onAdd: (card: Card, section: DeckSection) => void;
}

export default function CardSearchPanel({
    copiesByCard,
    busy,
    canAdd,
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
        <Panel title='Add Cards' flush className='flex max-h-[inherit] flex-col overflow-hidden' bodyClassName='flex min-h-0 flex-1 flex-col'>
            <div className='space-y-2 border-b border-line p-4'>
                <SearchInput value={text} onValueChange={setText} loading={isLoading || (search.length >= 2 && isPlaceholderData)} placeholder='Card Name...' aria-label='Card Name'></SearchInput>
                {search.length < 2 ? (
                    <p className='text-caption text-ink-faint'>Write at least 2 letters.</p>
                ) : (
                    results && <p className='text-caption text-ink-subtle'><span className='numeric text-ink'>{results.total}</span> cards found</p>
                )}
            </div>

            <div className='scrollbar-thin min-h-0 flex-1 overflow-y-auto'>
                {isError && <ErrorMessage className='m-4'>{error.message}</ErrorMessage>}

                {results && results.items.length === 0 && <p className='p-4 text-center text-sm text-ink-subtle'>No Card found.</p>}

                {results && results.items.length > 0 && (
                    <>
                        <ul className={cn('divide-y divide-line transition-opacity', isPlaceholderData && 'opacity-50')}>
                            {results.items.map((card) => {
                                const copies = copiesByCard[card.id] ?? 0;
                                return (
                                    <li key={card.id} className='flex gap-3 px-4 py-3 hover:bg-surface-hover/50'>
                                        <div className='w-card-xs shrink-0'>
                                            <CardTile card={card}></CardTile>
                                        </div>
                                        <div className='min-w-0 flex-1 space-y-1.5'>
                                            <div>
                                                <p className='truncate text-sm font-medium text-ink' title={card.name}>{card.name}</p>
                                                <p className={cn('truncate text-caption', frameTextClass(card))}>{card.type}</p>
                                            </div>
                                            <div className='flex flex-wrap items-center gap-1.5'>
                                                {allowedSections(card).map((section) => (
                                                    <button
                                                        key={section}
                                                        type='button'
                                                        onClick={() => onAdd(card, section)}
                                                        disabled={busy || !canAdd(card, section)}
                                                        className={cn(
                                                            'focus-ring inline-flex h-6 items-center gap-0.5 rounded-full border border-line-strong px-2 font-display text-micro font-semibold tracking-wide uppercase transition-colors',
                                                            'hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-30',
                                                            ZONE_STYLES[section].text,
                                                        )}
                                                    >
                                                        <PlusIcon className='size-3' />
                                                        {SECTION_LABELS[section]}
                                                    </button>
                                                ))}
                                                {copies > 0 && <span className='numeric text-micro text-ink-subtle'>In the Deck: {copies}</span>}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        <div className='px-4 pb-4'>
                            <Pagination page={page} totalPages={results.totalPages} disabled={isPlaceholderData} onChange={(next) => setPageState({ search, page: next })}></Pagination>
                        </div>
                    </>
                )}
            </div>
        </Panel>
    );
}