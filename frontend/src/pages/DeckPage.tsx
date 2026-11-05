import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { getDeck } from '../api';
import DeckDetailsForm from '../components/DeckDetailsForm';
import DeckEditor from '../components/DeckEditor';
import SidePatternsPanel from '../components/SidePatternsPanel';

type Tab = 'decklist' | 'side-patterns';

const TABS: { id: Tab; label: string }[] = [
    { id: 'decklist', label: 'Decklist' },
    { id: 'side-patterns', label: 'Side Patterns' },
];

export default function DeckPage() {
    const { id } = useParams<{ id: string }>();
    const [tab, setTab] = useState<Tab>('decklist');

    const deck = useQuery({
        queryKey: ['deck', id],
        queryFn: () => getDeck(id!),
        enabled: !!id,
    });

    return (
        <main className='mx-auto max-w-7xl p-8'>
            <Link to='/decks' className='text-sm text-blue-700 hover:underline'>
                ← All decks
            </Link>

            {deck.isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {deck.isError && <p className='mt-4 text-red-600'>{deck.error.message}</p>}

            {deck.data && (
                <>
                    <div className='mt-2'>
                        <DeckDetailsForm deck={deck.data}></DeckDetailsForm>
                    </div>

                    <div role='tablist' className='mt-4 flex gap-1 border-b border-gray-200'>
                        {TABS.map((t) => (
                            <button
                                key={t.id}
                                role='tab'
                                aria-selected={tab === t.id}
                                onClick={() => setTab(t.id)}
                                className={`-mb-px border-b-2 px-4 py-2 text-sm ${
                                    tab === t.id
                                        ? 'border-blue-600 font-semibold text-blue-700'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* The editor stays mounted but hidden: unmounting it would throw away the unsaved draft */}
                    <div role='tabpanel' className={tab === 'decklist' ? '' : 'hidden'}>
                        <DeckEditor key={deck.data.id} deck={deck.data}></DeckEditor>
                    </div>

                    {tab === 'side-patterns' && (
                        <div role='tabpanel'>
                            <SidePatternsPanel key={deck.data.id} deck={deck.data}></SidePatternsPanel>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}