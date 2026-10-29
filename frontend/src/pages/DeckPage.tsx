import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { getDeck, removeDeckCard, setDeckCard } from '../api';
import CardSearchPanel from '../components/CardSearchPanel';
import DeckSectionView from '../components/DeckSectionView';
import type { Card, DeckSection } from '../types';

export default function DeckPage() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();

    const deck = useQuery({
        queryKey: ['deck', id],
        queryFn: () => getDeck(id!),
        enabled: !!id,
    });

    const edit = useMutation({
        mutationFn: (v: { cardId: number; section: DeckSection; quantity: number }) =>
            v.quantity > 0
                ? setDeckCard(id!, v)
                : removeDeckCard(id!, v.cardId, v.section),
        onSuccess: (updated) => queryClient.setQueryData(['deck', id], updated),
    });

    const data = deck.data;
    const entries = data?.cards ?? [];

    const copiesByCard: Record<number, number> = {};
    for (const entry of entries) {
        copiesByCard[entry.cardId] =
            (copiesByCard[entry.cardId] ?? 0) + entry.quantity;
    }

    function change(cardId: number, section: DeckSection, quantity: number) {
        edit.mutate({ cardId, section, quantity });
    }

    function addCard(card: Card, section: DeckSection) {
        const current = entries.find((e) => e.cardId === card.id && e.section === section)?.quantity ?? 0;
        change(card.id, section, current + 1);
    }

    const sections: { section: DeckSection; title: string; min?: number; max: number }[] =
        data
            ? [
                {
                    section: 'MAIN',
                    title: 'Main Deck',
                    min: data.summary.limits.mainMin,
                    max: data.summary.limits.mainMax,
                },
                { section: 'EXTRA', title: 'Extra Deck', max: data.summary.limits.extraMax },
                { section: 'SIDE', title: 'Side Deck', max: data.summary.limits.sideMax },
              ]
            : [];

    return (
        <main className='mx-auto max-w-7xl p-8'>
            <Link to='/decks' className='text-sm text-blue-700 hover:underline'>
                ← All Decks
            </Link>

            {deck.isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {deck.isError && <p className='mt-4 text-red-600'>{deck.error.message}</p>}

            {data && (
                <div className='mt-2 grid gap-8 lg:grid-cols-[1fr_22rem]'>
                    <div>
                        <h1 className='text-3xl font-bold'>{data.name}</h1>
                        {data.archetype && <p className='mt-1 text-gray-600'>{data.archetype}</p>}
                        {data.summary.issues.map((issue) => (
                            <p key={issue} className='mt-2 text-sm text-amber-700'>{issue}</p>
                        ))}

                        {edit.isError && (
                            <p className='mt-4 whitespace-pre-line rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700'>{edit.error.message}</p>
                        )}

                        <div className='mt-6'>
                            {sections.map(({ section, title, min, max }) => (
                                <DeckSectionView
                                    key={section}
                                    title={title}
                                    entries={entries.filter((e) => e.section === section)}
                                    count={data.summary.counts[section]}
                                    min={min}
                                    max={max}
                                    maxCopies={data.summary.limits.maxCopies}
                                    copiesByCard={copiesByCard}
                                    busy={edit.isPending}
                                    onChange={(cardId, quantity) => change(cardId, section, quantity)}
                                >
                                </DeckSectionView>
                            ))}
                        </div>
                    </div>
                    <aside className='lg:sticky lg:top-4 lg:self-start'>
                        <CardSearchPanel
                            copiesByCard={copiesByCard}
                            maxCopies={data.summary.limits.maxCopies}
                            busy={edit.isPending}
                            onAdd={addCard}
                        >
                        </CardSearchPanel>
                    </aside>
                </div>
            )}
        </main>
    );
}