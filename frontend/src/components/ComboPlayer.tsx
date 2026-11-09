import { useEffect, useMemo, useState } from 'react';
import ComboBoard from './ComboBoard';
import { buildPlayback, changedInstances, stepTitle } from '../comboPlayback';
import type { Combo } from '../types';

export default function ComboPlayer({ combo }: { combo: Combo }) {
    const playback = useMemo(() => buildPlayback(combo), [combo]);
    const [index, setIndex] = useState(0);
    const last = playback.boards.length - 1;

    // Left and right arrows move through the steps
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'ArrowRight') {
                setIndex((i) => Math.min(last, i + 1));
            } else if (e.key === 'ArrowLeft') {
                setIndex((i) => Math.max(0, i - 1));
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [last]);

    if (playback.boards.length === 0) {
        return <p className='text-red-700'>{playback.errors.join('\n')}</p>;
    }

    // Derived: the index can never point outside the list
    const current = Math.min(index, last);
    const board = playback.boards[current]!;
    const changed = changedInstances(playback.boards[current - 1], board);
    const step = current > 0 ? playback.steps[current - 1] : undefined;

    return (
        <div className='grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
            <div className='space-y-3'>
                {playback.errors.length > 0 && (
                    <p className='whitespace-pre-line rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700'>
                        This Combo cannot be fully replayed:{'\n'}
                        {playback.errors.join('\n')}
                    </p>
                )}

                <ComboBoard board={board} cards={playback.cards} changed={changed}></ComboBoard>

                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={() => setIndex(0)}
                        disabled={current === 0}
                        className='rounded border px-3 py-1 disabled:opacity-40'
                    >
                        ⏮ Start
                    </button>
                    <button
                        type='button'
                        onClick={() => setIndex(current - 1)}
                        disabled={current === 0}
                        className='rounded border px-3 py-1 disabled:opacity-40'
                    >
                        ◀ Back
                    </button>
                    <button
                        type='button'
                        onClick={() => setIndex(current + 1)}
                        disabled={current === last}
                        className='rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-40'
                    >
                        Next ▶
                    </button>
                    <span className='text-sm text-gray-500'>
                        Step {current} / {last}
                    </span>
                </div>

                <div className='min-h-16 rounded border p-3'>
                    {step ? (
                        <>
                            <p className='font-semibold'>{stepTitle(step, playback.cards)}</p>
                            {step.note && <p className='mt-1 text-gray-700'>{step.note}</p>}
                        </>
                    ) : (
                        <p className='font-semibold'>Starting position</p>
                    )}
                </div>
            </div>

            <ol className='space-y-1 text-sm'>
                <li>
                    <button
                        type='button'
                        onClick={() => setIndex(0)}
                        className={`w-full rounded px-2 py-1 text-left ${
                            current === 0 ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-100'
                        }`}
                    >
                        Start
                    </button>
                </li>
                {playback.steps.map((s, i) => (
                    <li key={i}>
                        <button
                            type='button'
                            onClick={() => setIndex(i + 1)}
                            className={`w-full rounded px-2 py-1 text-left ${
                                current === i + 1 ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-100'
                            }`}
                        >
                            {i + 1}. {stepTitle(s, playback.cards)}
                        </button>
                    </li>
                ))}
            </ol>
        </div>
    );
}