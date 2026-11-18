import { useEffect, useRef, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchCards } from '../api';
import CardTile from '../components/CardTile';
import CardDetailDialog from '../components/CardDetailDialog';
import { useDebounce } from '../hooks/useDebounce';
import Pagination from '../components/Pagination';
import type { Card } from '../types';
import { CardsIcon } from '../ui/icons';
import { Page, PageHeader } from '../ui/PageHeader';
import { SearchInput } from '../ui/SearchInput';
import { EmptyState, ErrorMessage } from '../ui/States';
import { cn } from '../ui/styles';

const PAGE_SIZE = 24;

const GRID = 'grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6';

export default function CardSearchPage() {
    const [text, setText] = useState('');
    const search = useDebounce(text.trim(), 300);

    const [pageState, setPageState] = useState({ search: '', page: 1});
    const page = pageState.search === search ? pageState.page : 1;

    // Card shown in the detail window
    const [selected, setSelected] = useState<Card | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    function goToPage(next: number) {
        setPageState({ search, page: next });
        window.scrollTo({ top: 0 });
    }

    const { data, isPending, isError, error, isPlaceholderData } = useQuery ({
        queryKey: ['cards', search, page],
        queryFn: () => searchCards({ search, page, limit: PAGE_SIZE }),
        placeholderData: keepPreviousData,
    });

    // "/" moves the focus to the search field, unless the user is already typing somewhere
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            const target = e.target as HTMLElement;
            const typing = target.closest('input, textarea, select, [contenteditable="true"]');
            if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    // Typing or loading a new page: results on screen are not the final ones yet
    const updating = text.trim() !== search || isPlaceholderData;

    return (
        <Page>
            <div className='space-y-6'>
                <PageHeader eyebrow='Card Database' title='Search Cards' description='Find any card by name and open it to read its full text and stats.'></PageHeader>
                <SearchInput
                    ref={inputRef}
                    size='lg'
                    value={text}
                    onValueChange={setText}
                    loading={updating}
                    shortcut='/'
                    placeholder='Card name...'
                    aria-label='Card name'
                    autoFocus
                ></SearchInput>
            </div>

            {isError && <ErrorMessage>{error.message}</ErrorMessage>}

            {isPending && (
                <div className={GRID} aria-hidden='true'>
                    {Array.from({ length: 12 }, (_, i) => (
                        <div key={i} className='space-y-2'>
                            <div className='skeleton aspect-card rounded-card'></div>
                            <div className='skeleton h-3 w-3/4 rounded'></div>
                        </div>
                    ))}
                </div>
            )}

            {data && (
                <section aria-label='Results' className='space-y-4'>
                    <div className='flex items-baseline justify-between gap-4 border-b border-line pb-3'>
                        <p className='text-sm text-ink-subtle'>
                            <span className='numeric font-semibold text-ink'>{data.total.toLocaleString('it-IT')}</span> found cards
                            {search && (
                                <>
                                    {' '}for <span className='text-ink'>“{search}”</span>
                                </>
                            )}
                        </p>
                        {data.totalPages > 1 && (
                            <p className='numeric text-caption text-ink-faint'>
                                {page} / {data.totalPages}
                            </p>
                        )}
                    </div>

                    {data.items.length === 0 ? (
                        <EmptyState
                            icon={<CardsIcon />}
                            title='No card found.'
                            description='Check the spelling or try with a part of the name.'
                        ></EmptyState>
                    ) : (
                        <ul className={cn(GRID, 'transition-opacity', isPlaceholderData && 'opacity-50')}>
                            {data.items.map((card) => (
                                <li key={card.id}>
                                    <button
                                        type='button'
                                        onClick={() => setSelected(card)}
                                        className='focus-ring group block w-full rounded-card text-left'
                                    >
                                        <div className='transition-[transform,box-shadow] duration-200 group-hover:-translate-y-1 group-hover:shadow-glow-primary rounded-card'>
                                            <CardTile card={card}></CardTile>
                                        </div>
                                        <p className='mt-2 truncate text-caption text-ink-muted group-hover:text-ink'>{card.name}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <Pagination page={page} totalPages={data.totalPages} disabled={isPlaceholderData} onChange={goToPage}></Pagination>
                </section>
            )}

            <CardDetailDialog card={selected} onClose={() => setSelected(null)}></CardDetailDialog>
        </Page>
    );
}
