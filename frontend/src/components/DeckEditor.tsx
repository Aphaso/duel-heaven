import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveDeckList } from '../api';
import { blocksOf, isSameList, moveEntry, normalize, toDraft, withQuantity, type DraftEntry } from '../draft';
import type { Card, DeckDetail, DeckSection } from '../types';
import CardSearchPanel from './CardSearchPanel';
import DeckSectionView from './DeckSectionView';
import ZoneMeter from './ZoneMeter';
import { Button } from '../ui/Button';
import { CheckIcon, PlusIcon } from '../ui/icons';
import { cn } from '../ui/styles';
import { ErrorMessage, Notice } from '../ui/States';

const SECTIONS: { section: DeckSection; title: string }[] = [
    { section: 'MAIN', title: 'Main Deck' },
    { section: 'EXTRA', title: 'Extra Deck' },
    { section: 'SIDE', title: 'Side Deck' },
];

interface Props {
    deck: DeckDetail;
    onDirtyChange: (dirty: boolean) => void;
}

export default function DeckEditor({ deck, onDirtyChange }: Props) {
    const queryClient = useQueryClient();
    const { limits } = deck.summary;

    // The draft starts from what we have saved and from now on it only exists here
    const [draft, setDraft] = useState<DraftEntry[]>(() => toDraft(deck.cards));
    const dirty = !isSameList(draft, toDraft(deck.cards));

    const save = useMutation({
        // It is saved in the order in which the user sees the cards, using the position as the index
        mutationFn: () =>
            saveDeckList(
                deck.id,
                normalize(draft).map((e) => ({
                    cardId: e.card.id,
                    section: e.section,
                    quantity: e.quantity,
                })),
            ),
        onSuccess: (updated) => {
            queryClient.setQueryData(['deck', deck.id], updated);
            queryClient.invalidateQueries({ queryKey: ['decks'] });
        },
    });

    const unsaved = dirty && !save.isPending;
    useEffect(() => {
        onDirtyChange(unsaved);
        return () => onDirtyChange(false);
    }, [unsaved, onDirtyChange]);

    // Counters and copies calcolated based on the Draft
    const counts: Record<DeckSection, number> = { MAIN: 0, EXTRA: 0, SIDE: 0 };
    const copiesByCard: Record<number, number> = {};
    for (const e of draft) {
        counts[e.section] += e.quantity;
        copiesByCard[e.card.id] = (copiesByCard[e.card.id] ?? 0) + e.quantity;
    }
    const maxOf: Record<DeckSection, number> = {
        MAIN: limits.mainMax,
        EXTRA: limits.extraMax,
        SIDE: limits.sideMax,
    };

    function setQuantity(card: Card, section: DeckSection, quantity: number) {
        save.reset();
        setDraft((current) => withQuantity(current, card, section, quantity));
    }

    function addCard(card: Card, section: DeckSection) {
        const current = draft.find((e) => e.card.id === card.id && e.section === section)?.quantity ?? 0;
        setQuantity(card, section, current + 1);
    }

    function canAdd(card: Card, section: DeckSection) {
        return (
            (copiesByCard[card.id] ?? 0) < limits.maxCopies &&
            counts[section] < maxOf[section]
        );
    }

    function reorder(fromKey: string, toKey: string) {
        save.reset();
        setDraft((current) => moveEntry(current, fromKey, toKey));
    }

    function discard() {
        save.reset();
        setDraft(toDraft(deck.cards));
    }

    const mainIncomplete = counts.MAIN < limits.mainMin;

    // Mobile only: the search panel opens as a sheet from the bottom of the screen
    const [sheetOpen, setSheetOpen] = useState(false);
    const sheetRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!sheetOpen) {
            return;
        }
        // The page behind does not scroll while the sheet is open (only below lg, where it is a sheet)
        const mobile = window.matchMedia('(max-width: 63.999rem)').matches;
        const previous = document.body.style.overflow;
        if (mobile) {
            document.body.style.overflow = 'hidden';
            sheetRef.current?.querySelector('input')?.focus();
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setSheetOpen(false);
            }
        }
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = previous;
            document.removeEventListener('keydown', onKey);
        };
    }, [sheetOpen]);

    return (
        <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_var(--spacing-sidebar)]'>
            <div className='min-w-0 space-y-4'>
                {/* Toolbar stuck under the top bar: save state and counters of the three zones */}
                <div className='sticky top-topbar z-20 -mx-gutter border-y border-line bg-surface-base/85 px-gutter py-3 backdrop-blur-md sm:mx-0 sm:rounded-panel sm:border sm:px-4'>
                    <div className='flex flex-wrap items-center gap-x-6 gap-y-3'>
                        <div className='flex flex-wrap items-center gap-2'>
                            <Button variant='secondary' size='sm' onClick={() => setSheetOpen(true)} className='lg:hidden' aria-haspopup='dialog'>
                                <PlusIcon className='size-4' />
                                Add Cards
                            </Button>
                            <Button variant='primary' size='sm' onClick={() => save.mutate()} disabled={!dirty} loading={save.isPending}>
                                {save.isPending ? 'Saving...' : 'Save'}
                            </Button>
                            <Button variant='ghost' size='sm' onClick={discard} disabled={!dirty || save.isPending}>
                                Discard Changes
                            </Button>
                            {dirty ? (
                                <span className='flex items-center gap-1.5 text-caption text-warning'>
                                    <span className='size-1.5 rounded-full bg-warning'></span>
                                    Unsaved Changes
                                </span>
                            ) : (
                                <span className='flex items-center gap-1.5 text-caption text-ink-subtle'>
                                    <CheckIcon className='size-3.5 text-success' />
                                    Saved
                                </span>
                            )}
                        </div>
                        <div className='flex flex-1 flex-wrap gap-x-5 gap-y-2 sm:justify-end'>
                            {SECTIONS.map(({ section, title }) => (
                                <ZoneMeter
                                    key={section}
                                    section={section}
                                    label={title.replace(' Deck', '')}
                                    count={counts[section]}
                                    max={maxOf[section]}
                                    min={section === 'MAIN' ? limits.mainMin : undefined}
                                    className='w-24'
                                ></ZoneMeter>
                            ))}
                        </div>
                    </div>
                </div>

                {mainIncomplete && (
                    <Notice>
                        Incomplete Main Deck: <span className='numeric'>{counts.MAIN}/{limits.mainMin}</span> cards
                    </Notice>
                )}

                {save.isError && <ErrorMessage>{save.error.message}</ErrorMessage>}

                {SECTIONS.map(({ section, title }) => (
                    <DeckSectionView
                        key={section}
                        section={section}
                        title={title}
                        blocks={blocksOf(draft, section)}
                        count={counts[section]}
                        min={section === 'MAIN' ? limits.mainMin : undefined}
                        max={maxOf[section]}
                        canAddCopy={(card) => canAdd(card, section)}
                        busy={save.isPending}
                        onChange={(card, quantity) => setQuantity(card, section, quantity)}
                        onReorder={reorder}
                    >
                    </DeckSectionView>
                ))}
            </div>

            {/* Mobile: dark layer behind the sheet, a tap closes it */}
            {sheetOpen && (
                <div aria-hidden='true' onClick={() => setSheetOpen(false)} className='fixed inset-0 z-[55] animate-fade-in bg-night-950/70 backdrop-blur-sm lg:hidden'></div>
            )}

            {/*
              The same panel in two layouts, so the search survives open/close:
              desktop = sticky side column; mobile = sheet from the bottom, hidden until opened.
            */}
            <aside
                ref={sheetRef}
                aria-label='Add Cards'
                className={cn(
                    'lg:sticky lg:top-[calc(var(--spacing-topbar)+1rem)] lg:max-h-[calc(100dvh-var(--spacing-topbar)-2rem)] lg:self-start',
                    'max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-[60] max-lg:flex max-lg:h-[85dvh] max-lg:animate-rise-in max-lg:flex-col',
                    'max-lg:rounded-t-panel max-lg:border-t max-lg:border-line-strong max-lg:bg-surface-raised max-lg:pb-[env(safe-area-inset-bottom)] max-lg:shadow-overlay',
                    !sheetOpen && 'max-lg:hidden',
                )}
            >
                {/* Mobile only: handle and live counters, to see what the deck looks like while adding */}
                <div className='shrink-0 space-y-3 px-4 pt-2 pb-3 lg:hidden'>
                    <div aria-hidden='true' className='mx-auto h-1 w-10 rounded-full bg-line-strong'></div>
                    <div className='flex gap-4'>
                        {SECTIONS.map(({ section, title }) => (
                            <ZoneMeter
                                key={section}
                                section={section}
                                label={title.replace(' Deck', '')}
                                count={counts[section]}
                                max={maxOf[section]}
                                min={section === 'MAIN' ? limits.mainMin : undefined}
                                className='min-w-0 flex-1'
                            ></ZoneMeter>
                        ))}
                    </div>
                </div>
                <CardSearchPanel
                    copiesByCard={copiesByCard}
                    busy={save.isPending}
                    canAdd={canAdd}
                    onAdd={addCard}
                    className='max-lg:min-h-0 max-lg:flex-1 max-lg:rounded-none max-lg:border-x-0 max-lg:border-b-0 max-lg:shadow-none'
                    actions={
                        <Button size='sm' variant='primary' onClick={() => setSheetOpen(false)} className='lg:hidden'>
                            Done
                        </Button>
                    }
                >
                </CardSearchPanel>
            </aside>
        </div>
    );
}