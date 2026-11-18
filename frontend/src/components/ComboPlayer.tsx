import { useEffect, useMemo, useState } from 'react';
import ComboBoard from './ComboBoard';
import { buildPlayback, changedInstances, stepTitle } from '../comboPlayback';
import type { Combo } from '../types';
import { Button } from '../ui/Button';
import { ChevronLeftIcon, ChevronRightIcon, SkipStartIcon } from '../ui/icons';
import { Panel } from '../ui/Panel';
import { ErrorMessage } from '../ui/States';
import { cn, panelStyles } from '../ui/styles';

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
        return <ErrorMessage>{playback.errors.join('\n')}</ErrorMessage>;
    }

    // Derived: the index can never point outside the list
    const current = Math.min(index, last);
    const board = playback.boards[current]!;
    const changed = changedInstances(playback.boards[current - 1], board);
    const step = current > 0 ? playback.steps[current - 1] : undefined;

    const progress = last === 0 ? 100 : (current / last) * 100;

    return (
        <div className='grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
            <div className='min-w-0 space-y-4'>
                {playback.errors.length > 0 && (
                    <ErrorMessage>
                        This Combo cannot be fully replayed:{'\n'}
                        {playback.errors.join('\n')}
                    </ErrorMessage>
                )}

                <ComboBoard board={board} cards={playback.cards} changed={changed}></ComboBoard>

                {/* Transport: buttons, step counter and progress */}
                <div className={`${panelStyles} space-y-3 p-4`}>
                    <div className='flex items-center gap-2'>
                        <Button size='icon' variant='ghost' onClick={() => setIndex(0)} disabled={current === 0} aria-label='Start' title='Start'>
                            <SkipStartIcon className='size-4' />
                        </Button>
                        <Button size='sm' onClick={() => setIndex(current - 1)} disabled={current === 0}>
                            <ChevronLeftIcon className='size-4' />
                            Back
                        </Button>
                        <Button size='sm' variant='primary' onClick={() => setIndex(current + 1)} disabled={current === last}>
                            Next
                            <ChevronRightIcon className='size-4' />
                        </Button>
                        <span className='ml-auto text-right'>
                            <span className='label block text-ink-faint'>Step</span>
                            <span className='numeric text-sm text-ink-subtle'>
                                <span className='text-heading text-ink'>{current}</span> / {last}
                            </span>
                        </span>
                    </div>
                    <div className='h-1 overflow-hidden rounded-full bg-surface-sunken'>
                        <div className='h-full rounded-full bg-gradient-to-r from-aether-400 to-arcane-400 transition-[width] duration-300' style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className='hidden text-caption text-ink-faint sm:block'>
                        Tip: use <kbd className='rounded border border-line-strong px-1 font-mono'>←</kbd> <kbd className='rounded border border-line-strong px-1 font-mono'>→</kbd> to move through the steps.
                    </p>
                </div>

                {/* What the current step does */}
                <div key={current} className='flex min-h-20 animate-fade-in gap-4 rounded-panel border border-arcane-900 bg-arcane-950/40 p-4'>
                    <span className='numeric grid size-9 shrink-0 place-items-center rounded-full border border-arcane-700 bg-arcane-950 text-sm font-bold text-arcane-200'>
                        {current === 0 ? '●' : current}
                    </span>
                    <div className='min-w-0'>
                        {step ? (
                            <>
                                <p className='font-display text-heading text-ink'>{stepTitle(step, playback.cards)}</p>
                                {step.note && <p className='mt-1 text-sm text-ink-muted'>{step.note}</p>}
                            </>
                        ) : (
                            <p className='font-display text-heading text-ink'>Starting position</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Timeline of the steps */}
            <aside className='lg:sticky lg:top-[calc(var(--spacing-topbar)+1rem)] lg:self-start'>
                <Panel title='Steps' actions={<span className='numeric text-caption text-ink-subtle'>{playback.steps.length}</span>} flush>
                    <ol className='scrollbar-thin relative max-h-[60dvh] space-y-0.5 overflow-y-auto p-2'>
                        {[{ label: 'Start', index: 0 }, ...playback.steps.map((s, i) => ({ label: stepTitle(s, playback.cards), index: i + 1 }))].map(({ label, index: stepIndex }) => {
                            const active = current === stepIndex;
                            const done = stepIndex < current;
                            return (
                                <li key={stepIndex}>
                                    <button
                                        type='button'
                                        onClick={() => setIndex(stepIndex)}
                                        aria-current={active ? 'step' : undefined}
                                        className={cn(
                                            'focus-ring flex w-full items-start gap-3 rounded-control px-2 py-2 text-left text-sm transition-colors',
                                            active ? 'bg-arcane-950 text-ink' : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                'numeric mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-micro font-bold',
                                                active
                                                    ? 'bg-secondary text-ink shadow-glow-secondary'
                                                    : done
                                                      ? 'bg-arcane-900 text-arcane-200'
                                                      : 'border border-line-strong text-ink-faint',
                                            )}
                                        >
                                            {stepIndex === 0 ? '●' : stepIndex}
                                        </span>
                                        <span className={cn('min-w-0', active && 'font-semibold')}>{label}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                </Panel>
            </aside>
        </div>
    );
}