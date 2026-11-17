import { useEffect, useState } from 'react';
import { cardImageUrl } from '../api';
import WthCardSearch from './WthCardSearch';
import { addResponse, addTarget, isSameWthDraft, removeResponse, removeTarget, setEntryNotes, WTH_MAX_RESPONSES, wthProblems, type WthDraft } from '../wthDraft';
import { useConfirm } from '../confirm/useConfirm';

interface Props {
    initial: WthDraft;
    saving: boolean;
    error: string | null;
    onSave: (draft: WthDraft) => void;
    /** Only when there is something to go back to (editing an existing guide). */
    onCancel?: () => void;
    onDirtyChange: (dirty: boolean) => void;
}

type Picker = { kind: 'target' } | { kind: 'response'; targetId: number } | null;

export default function WthGuideEditor({
    initial,
    saving,
    error,
    onSave,
    onCancel,
    onDirtyChange,
}: Props) {
    const [draft, setDraft] = useState<WthDraft>(initial);
    const [picker, setPicker] = useState<Picker>(null);
    const confirm = useConfirm();

    const dirty = !isSameWthDraft(draft, initial);
    const problems = wthProblems(draft);
    const canSave = dirty && problems.length === 0 && !saving;

    useEffect(() => {
        onDirtyChange(dirty);
        return () => onDirtyChange(false);
    }, [dirty, onDirtyChange]);

    // The picker may point to an opponent card that was just removed: then it is closed
    const activePicker =
        picker && (picker.kind === 'target' || draft.entries.some((e) => e.card.id === picker.targetId))
            ? picker
            : null;
    const pickerEntry =
        activePicker?.kind === 'response'
            ? draft.entries.find((e) => e.card.id === activePicker.targetId)
            : undefined;

    async function cancel() {
        if (dirty && !(await confirm({
            title: 'Discard changes?',
            message: 'Your chagnes to this Guide will be lost.',
            confirmLabel: 'Discard',
            destructive: true,
        }))) {
            return;
        }
        onCancel?.();
    }

    return (
        <div className='space-y-4'>
            <div className='grid gap-3 sm:grid-cols-2'>
                <label className='block text-sm'>
                    Opponent Deck
                    <input
                        value={draft.opponentDeckName}
                        onChange={(e) => setDraft({ ...draft, opponentDeckName: e.target.value })}
                        maxLength={100}
                        className='mt-1 w-full rounded border px-2 py-1'
                    >
                    </input>
                </label>
                <label className='block text-sm'>
                    Notes (optional)
                    <input
                        value={draft.notes}
                        onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                        maxLength={1000}
                        className='mt-1 w-full rounded border px-2 py-1'
                    />
                </label>
            </div>

            {draft.entries.map((entry) => (
                <section key={entry.card.id} className='space-y-2 rounded border p-3'>
                    <div className='flex flex-wrap items-start gap-4'>
                        <figure className='w-28'>
                            <img src={cardImageUrl(entry.card.id)} alt={entry.card.name} draggable={false} className='w-full'></img>
                            <figcaption className='truncate text-center text-xs'>{entry.card.name}</figcaption>
                        </figure>
                        <span aria-hidden className='self-center text-3xl text-gray-400'>→</span>
                        <ul className='flex flex-wrap gap-3'>
                            {entry.responses.map((r) => (
                                <li key={r.id} className='w-24 text-center'>
                                    <img src={cardImageUrl(r.id)} alt={r.name} draggable={false} className='w-full'></img>
                                    <span className='block truncate text-xs'>{r.name}</span>
                                    <button
                                        type='button'
                                        onClick={() => setDraft(removeResponse(draft, entry.card.id, r.id))}
                                        className='text-xs text-red-700 underline'
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <input
                        value={entry.notes}
                        onChange={(e) => setDraft(setEntryNotes(draft, entry.card.id, e.target.value))}
                        placeholder='Note for this card (optional)'
                        maxLength={500}
                        className='w-full rounded border px-2 py-1 text-sm'
                    >
                    </input>
                    <div className='flex gap-3 text-sm'>
                        <button
                            type='button'
                            disabled={entry.responses.length >= WTH_MAX_RESPONSES}
                            onClick={() => setPicker({ kind: 'response', targetId: entry.card.id })}
                            className='rounded border px-2 py-1 disabled:opacity-40'
                        >
                            + Add response
                        </button>
                        <button
                            type='button'
                            onClick={() => setDraft(removeTarget(draft, entry.card.id))}
                            className='rounded border border-red-600 px-2 py-1 text-red-700'
                        >
                            Remove this Card
                        </button>
                    </div>
                </section>
            ))}

            <button
                type='button'
                onClick={() => setPicker({ kind: 'target' })}
                className='rounded border border-dashed px-3 py-1 text-sm'
            >
                + Add Opponent Card
            </button>

            {activePicker?.kind === 'target' && (
                <WthCardSearch
                    title='Opponent Card'
                    disabledIds={new Set(draft.entries.map((e) => e.card.id))}
                    onPick={(card) => setDraft((d) => addTarget(d, card))}
                    onClose={() => setPicker(null)}
                >
                </WthCardSearch>
            )}
            {activePicker?.kind === 'response' && pickerEntry && (
                <WthCardSearch
                    title={`Cards to activate against ${pickerEntry.card.name}`}
                    disabledIds={new Set(pickerEntry.responses.map((r) => r.id))}
                    onPick={(card) => setDraft((d) => addResponse(d, activePicker.targetId, card))}
                    onClose={() => setPicker(null)}
                >
                </WthCardSearch>
            )}

            {dirty && problems.length > 0 && (
                <ul className='list-disc pl-5 text-sm text-amber-700'>
                    {problems.map((p) => (
                        <li key={p}>{p}</li>
                    ))}
                </ul>
            )}
            {error && <p className='whitespace-pre-line text-sm text-red-700'>{error}</p>}

            <div className='flex items-center gap-2'>
                <button
                    type='button'
                    disabled={!canSave}
                    onClick={() => onSave(draft)}
                    className='rounded bg-blue-600 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40'
                >
                    {saving ? 'Saving...' : 'Save'}
                </button>
                {onCancel && (
                    <button type='button' onClick={() => void cancel()} className='rounded border px-4 py-2'>
                        Cancel
                    </button>
                )}
                {dirty ? (
                    <span className='text-sm text-amber-700'>Unsaved Changes</span>
                ) : (
                    <span className='text-sm text-gray-500'>Saved</span>
                )}
            </div>
        </div>
    );
}