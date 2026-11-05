import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteSidePattern, listSidePatterns } from '../api';
import type { DeckDetail } from '../types';
import SidePatternView from './SidePatternView';

export default function SidePatternsPanel({ deck }: { deck: DeckDetail }) {
    const queryClient = useQueryClient();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const patterns = useQuery({
        queryKey: ['side-patterns', deck.id],
        queryFn: () => listSidePatterns(deck.id),
    });

    const remove = useMutation({
        mutationFn: (id: string) => deleteSidePattern(deck.id, id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['side-patterns', deck.id] }),
    });

    const list = patterns.data ?? [];
    // Nothing selected, or the selected one was deleted: show the first
    // Derived on every render, so no effect is needed to "fix" the selection
    const selected = list.find((p) => p.id === selectedId) ?? list[0];

    function handleDelete(id: string, name: string) {
        if (window.confirm(`Delete the side pattern against "${name}?`)) {
            remove.mutate(id);
        }
    }

    return (
        <div className='mt-4 grid gap-6 md:grid-cols-[14rem_minmax(0,1fr)]'>
            <nav aria-label='Side Patterns'>
                <h2 className='text-xl font-semibold'>Opponents</h2>

                {patterns.isPending && <p className='mt-3 text-sm text-gray-500'>Loading...</p>}
                {patterns.isError && (
                    <p className='mt-3 text-sm text-red-600'>{patterns.error.message}</p>
                )}
                {patterns.data && list.length === 0 && (
                    <p className='mt-3 text-sm text-gray-500'>No Side Patterns yet.</p>
                )}

                <ul className='mt-3 space-y-1'>
                    {list.map((pattern) => (
                        <li key={pattern.id}>
                            <button
                                onClick={() => setSelectedId(pattern.id)}
                                aria-current={pattern.id === selected?.id}
                                className={`flex w-full items-center justify-between gap-2 rounded px-3 py-2 text-left text-sm ${
                                    pattern.id === selected?.id
                                        ? 'bg-blue-50 font-semibold text-blue-700'
                                        : 'hover:bg-gray-100'
                                }`}
                            >
                                <span className='min-w-0 truncate'>{pattern.opponentDeckName}</span>
                                {pattern.issues.length > 0 && (
                                    <span title='Does not match the saved Decklist' className='shrink-0 rounded bg-amber-100 px-1.5 text-xs text-amber-800'>
                                        Outdated
                                    </span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            <section className='min-w-0'>
                {selected && (
                    <>
                        <div className='flex flex-wrap items-start justify-between gap-3'>
                            <h2 className='break-words text-2xl font-bold'>
                                vs {selected.opponentDeckName}
                            </h2>
                            <button
                                onClick={() => handleDelete(selected.id, selected.opponentDeckName)}
                                disabled={remove.isPending}
                                className='rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-40'
                            >
                                Delete
                            </button>
                        </div>
                        {remove.isError && <p className='mt-2 whitespace-pre-line text-sm text-red-600'>{remove.error.message}</p>}
                        <SidePatternView pattern={selected}></SidePatternView>
                    </>
                )}
            </section>
        </div>
    );
}