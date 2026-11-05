import { useEffect, useState } from 'react';
import PatternCardPicker from './PatternCardPicker';
import { hasName, isBalanced, isSameDraft, laneTotals, lanePools, setCopies, type PatternDraft } from '../sidePatternDraft';
import type { DeckCardEntry } from '../types';

interface Props {
    initial: PatternDraft;
    deckCards: DeckCardEntry[];
    decklistDirty: boolean;
    saving: boolean;
    error: string | null;
    onSave: (draft: PatternDraft) => void;
    onCancel: () => void;
    onDirtyChange: (dirty: boolean) => void;
}

const LANE_LABEL = { MAIN: 'Main Deck', EXTRA: 'Extra Deck' } as const;

export default function SidePatternEditor({
    initial,
    deckCards,
    decklistDirty,
    saving,
    error,
    onSave,
    onCancel,
    onDirtyChange,
}: Props) {
    const [draft, setDraft] = useState<PatternDraft>(initial);

    const dirty = !isSameDraft(draft, initial);
    const pools = lanePools(deckCards, draft);
    const totals = laneTotals(draft);
    const canSave = hasName(draft) && isBalanced(draft) && dirty && !saving;

    useEffect(() => {
        onDirtyChange(dirty);
        return () => onDirtyChange(false);
    }, [dirty, onDirtyChange]);

    function cancel() {
        if (dirty && !window.confirm('Discard changes to this Side Pattern?')) {
            return;
        }
        onCancel();
    }

    const outIds = new Set(draft.cardsOut.map((e) => e.card.id));
    const inIds = new Set(draft.cardsIn.map((e) => e.card.id));

    return (
        <div className='space-y-4'>
            <div className='grid gap-3 sm:grid-cols-2'>
                <label className='block text-sm'>
                    Opponent deck
                    <input
                        value={draft.opponentDeckName}
                        onChange={(e) =>
                            setDraft({ ...draft, opponentDeckName: e.target.value })
                        }
                        maxLength={100}
                        className='mt-1 w-full rounded border px-2 py-1'
                    />
                </label>
                <label className='block text-sm'>
                    Notes (optional)
                    <input
                        value={draft.notes}
                        onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                        className='mt-1 w-full rounded border px-2 py-1'
                    />
                </label>
            </div>

            {decklistDirty && (
                <p className='rounded bg-yellow-100 p-2 text-sm'>
                    The Decklist has unsaved changes. Side Patterns use the saved decklist.
                </p>
            )}

            {pools.length === 0 && (
                <p className='text-sm text-gray-500'>
                    Add cards to the Side Deck (and save the Decklist) to build a Pattern.
                </p>
            )}

            {pools.map((pool) => {
                const t = totals[pool.lane];
                const ok = t.outCount === t.inCount;
                return (
                    <div key={pool.lane} className='space-y-2 rounded border p-3'>
                        <div className='flex items-center justify-between'>
                            <h3 className='font-semibold'>{LANE_LABEL[pool.lane]}</h3>
                            <span className={ok ? 'text-green-700' : 'text-red-700'}>
                                Out {t.outCount} / In {t.inCount}
                                {ok ? ' ✓' : ' ✗'}
                            </span>
                        </div>
                        <div className='grid gap-4 md:grid-cols-2'>
                            <PatternCardPicker
                                title='Out'
                                candidates={pool.outCandidates}
                                selected={draft.cardsOut}
                                blockedIds={inIds}
                                onChange={(c, q) =>
                                    setDraft(setCopies(draft, 'OUT', c.card, q))
                                }
                            />
                            <PatternCardPicker
                                title='In'
                                candidates={pool.inCandidates}
                                selected={draft.cardsIn}
                                blockedIds={outIds}
                                onChange={(c, q) =>
                                    setDraft(setCopies(draft, 'IN', c.card, q))
                                }
                            />
                        </div>
                    </div>
                );
            })}

            {error && <p className='text-sm text-red-700'>{error}</p>}

            <div className='flex gap-2'>
                <button
                    type='button'
                    disabled={!canSave}
                    onClick={() => onSave(draft)}
                    className='rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-40'
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                    type='button'
                    onClick={cancel}
                    className='rounded border px-3 py-1'
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}