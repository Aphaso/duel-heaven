import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveDeckList } from '../api';
import { isSameList, toDraft, withQuantity, type DraftEntry } from '../draft';
import type { Card, DeckDetail, DeckSection } from '../types';
import CardSearchPanel from './CardSearchPanel';
import DeckSectionView from './DeckSectionView';

const SECTIONS: { section: DeckSection; title: string }[] = [
    { section: 'MAIN', title: 'Main Deck' },
    { section: 'EXTRA', title: 'Extra Deck' },
    { section: 'SIDE', title: 'Side Deck' },
];

export default function DeckEditor({ deck }: { deck: DeckDetail }) {
    const queryClient = useQueryClient();
    const { limits } = deck.summary;

    const [draft, setDraft] = useState<DraftEntry[]>(() => toDraft(deck.cards));
    const saved = toDraft(deck.cards);
    const dirty = !isSameList(draft, saved);

    const save = useMutation({
        mutationFn: () =>
            saveDeckList(
                deck.id,
                draft.map((e) => ({
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

    useEffect(() => {
        if (!dirty) {
            return;
        }
        const warn = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);

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

    function discard() {
        save.reset();
        setDraft(toDraft(deck.cards));
    }

    const mainIncomplete = counts.MAIN < limits.mainMin;

    return (
        <div className='mt-2 grid gap-8 lg:grid-cols-[1fr_22rem]'>
            <div>
                <h1 className='text-3xl font-bold'>{deck.name}</h1>
                {deck.archetype && <p className='mt-1 text-gray-600'>{deck.archetype}</p>}

                <div className='sticky top-0 z-10 -mx-2 mt-3 flex flex-wrap items-center gap-3 bg-white/90 px-2 py-3 backdrop-blur'>
                    <button onClick={() => save.mutate()} disabled={!dirty || save.isPending} className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40'>
                        {save.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={discard} disabled={!dirty || save.isPending} className='rounded border border-gray-300 px-4 py-2 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40'>
                        Discard changes
                    </button>
                    {dirty ? (
                        <span className='text-sm test-amber-700'>Changes not saved</span>
                    ) : (
                        <span className='text-sm text-gray-500'>Saved</span>
                    )}
                </div>

                {mainIncomplete && (
                    <p className='mt-2 text-sm text-amber-700'>
                        Incomplete Main Deck: {counts.MAIN}/{limits.mainMin} minimum cards
                    </p>
                )}

                {save.isError && (
                    <p className='mt-4 whitespace-pre-line rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700'>
                        {save.error.message}
                    </p>
                )}

                <div className='mt-6'>
                    {SECTIONS.map(({ section, title }) => (
                        <DeckSectionView
                            key={section}
                            title={title}
                            entries={draft.filter((e) => e.section === section).sort((a, b) => a.card.name.localeCompare(b.card.name))}
                            count={counts[section]}
                            min={section === 'MAIN' ? limits.mainMin : undefined}
                            max={maxOf[section]}
                            maxCopies={limits.maxCopies}
                            copiesByCard={copiesByCard}
                            busy={save.isPending}
                            onChange={(card, quantity) => setQuantity(card, section, quantity)}
                        >
                        </DeckSectionView>
                    ))}
                </div>
            </div>

            <aside className='lg:sticky lg:top-4 lg:self-start'>
                <CardSearchPanel copiesByCard={copiesByCard} busy={save.isPending} canAdd={canAdd} onAdd={addCard}></CardSearchPanel>
            </aside>
        </div>
    );
}