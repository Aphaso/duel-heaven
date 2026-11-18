import { useEffect, useState } from 'react';
import WthCardSearch from './WthCardSearch';
import { addResponse, addTarget, isSameWthDraft, removeResponse, removeTarget, setEntryNotes, WTH_MAX_RESPONSES, wthProblems, type WthDraft } from '../wthDraft';
import { useConfirm } from '../confirm/useConfirm';
import CardTile from './CardTile';
import { WthMatchup } from './WthMatchup';
import { Button } from '../ui/Button';
import { Field, Input } from '../ui/Field';
import { CheckIcon, CloseIcon, PlusIcon, TrashIcon } from '../ui/icons';
import { ErrorMessage, Notice } from '../ui/States';
import { panelStyles } from '../ui/styles';

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
        <div className='space-y-5'>
            <div className={`${panelStyles} grid gap-4 p-panel sm:grid-cols-2`}>
                <Field label='Opponent Deck'>
                    {(control) => (
                        <Input
                            {...control}
                            value={draft.opponentDeckName}
                            onChange={(e) => setDraft({ ...draft, opponentDeckName: e.target.value })}
                            maxLength={100}
                            placeholder='e.g. Snake-Eye'
                        >
                        </Input>
                    )}
                </Field>
                <Field label='Notes (optional)'>
                    {(control) => (
                        <Input
                            {...control}
                            value={draft.notes}
                            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                            maxLength={1000}
                        />
                    )}
                </Field>
            </div>

            {draft.entries.map((entry, i) => (
                <div key={entry.card.id} className='space-y-3'>
                    <WthMatchup
                        index={i + 1}
                        target={entry.card}
                        className={activePicker?.kind === 'response' && activePicker.targetId === entry.card.id ? 'ring-1 ring-aether-700' : undefined}
                        targetActions={
                            <Button size='sm' variant='danger-ghost' onClick={() => setDraft(removeTarget(draft, entry.card.id))} className='w-full'>
                                <TrashIcon className='size-4' />
                                Remove this Card
                            </Button>
                        }
                        responses={
                            <ul className='flex flex-wrap gap-3'>
                                {entry.responses.map((r) => (
                                    <li key={r.id} className='group relative w-card-md'>
                                        <CardTile card={r}></CardTile>
                                        <p className='mt-1 truncate text-center text-micro text-ink-muted' title={r.name}>{r.name}</p>
                                        <button
                                            type='button'
                                            onClick={() => setDraft(removeResponse(draft, entry.card.id, r.id))}
                                            aria-label={`Remove ${r.name}`}
                                            title='Remove'
                                            className='focus-ring absolute -top-2 -right-2 grid size-6 place-items-center rounded-full border border-line-strong bg-surface-overlay text-ink-subtle shadow-card transition-colors hover:border-danger hover:bg-danger hover:text-ink'
                                        >
                                            <CloseIcon className='size-3.5' />
                                        </button>
                                    </li>
                                ))}
                                <li>
                                    {/* Placeholder shaped like a card that opens the search */}
                                    <button
                                        type='button'
                                        disabled={entry.responses.length >= WTH_MAX_RESPONSES}
                                        onClick={() => setPicker({ kind: 'response', targetId: entry.card.id })}
                                        className='focus-ring flex aspect-card w-card-md flex-col items-center justify-center gap-1 rounded-card border border-dashed border-line-strong text-ink-subtle transition-colors hover:border-primary hover:bg-aether-950/40 hover:text-primary disabled:pointer-events-none disabled:opacity-30'
                                    >
                                        <PlusIcon className='size-5' />
                                        <span className='px-1 text-center text-micro font-semibold'>Add response</span>
                                    </button>
                                </li>
                            </ul>
                        }
                        footer={
                            <Input
                                value={entry.notes}
                                onChange={(e) => setDraft(setEntryNotes(draft, entry.card.id, e.target.value))}
                                placeholder='Note for this card (optional)'
                                aria-label={`Note for ${entry.card.name}`}
                                maxLength={500}
                                className='h-9'
                            >
                            </Input>
                        }
                    ></WthMatchup>

                    {activePicker?.kind === 'response' && activePicker.targetId === entry.card.id && pickerEntry && (
                        <WthCardSearch
                            title={`Cards to activate against ${pickerEntry.card.name}`}
                            disabledIds={new Set(pickerEntry.responses.map((r) => r.id))}
                            onPick={(card) => setDraft((d) => addResponse(d, activePicker.targetId, card))}
                            onClose={() => setPicker(null)}
                        >
                        </WthCardSearch>
                    )}
                </div>
            ))}

            {activePicker?.kind === 'target' ? (
                <WthCardSearch
                    title='Opponent Card'
                    disabledIds={new Set(draft.entries.map((e) => e.card.id))}
                    onPick={(card) => setDraft((d) => addTarget(d, card))}
                    onClose={() => setPicker(null)}
                >
                </WthCardSearch>
            ) : (
                <button
                    type='button'
                    onClick={() => setPicker({ kind: 'target' })}
                    className='focus-ring flex w-full items-center justify-center gap-2 rounded-panel border border-dashed border-line-strong py-6 font-display text-sm font-semibold text-ink-subtle transition-colors hover:border-danger/50 hover:bg-danger/5 hover:text-danger'
                >
                    <PlusIcon className='size-4' />
                    Add Opponent Card
                </button>
            )}

            {dirty && problems.length > 0 && (
                <Notice title='Before saving:'>
                    <ul className='list-disc space-y-0.5 pl-5'>
                        {problems.map((p) => (
                            <li key={p}>{p}</li>
                        ))}
                    </ul>
                </Notice>
            )}
            {error && <ErrorMessage>{error}</ErrorMessage>}

            {/* Save bar always visible at the bottom of the screen */}
            <div className='sticky bottom-20 z-20 flex items-center gap-3 rounded-panel border border-line bg-surface-overlay/90 px-4 py-3 shadow-overlay backdrop-blur-md lg:bottom-4'>
                <Button variant='primary' disabled={!canSave} onClick={() => onSave(draft)}>
                    {saving ? 'Saving...' : 'Save'}
                </Button>
                {onCancel && (
                    <Button variant='ghost' onClick={() => void cancel()}>
                        Cancel
                    </Button>
                )}
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
        </div>
    );
}