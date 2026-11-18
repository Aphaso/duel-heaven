import { useEffect, useState } from 'react';
import PatternCardPicker from './PatternCardPicker';
import { hasName, isBalanced, isSameDraft, laneTotals, lanePools, setCopies, type PatternDraft } from '../sidePatternDraft';
import type { DeckCardEntry } from '../types';
import { useConfirm } from '../confirm/useConfirm';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Field, Input } from '../ui/Field';
import { Panel } from '../ui/Panel';
import { ErrorMessage, Notice } from '../ui/States';
import { panelStyles } from '../ui/styles';

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
    const confirm = useConfirm();

    const dirty = !isSameDraft(draft, initial);
    const pools = lanePools(deckCards, draft);
    const totals = laneTotals(draft);
    const canSave = hasName(draft) && isBalanced(draft) && dirty && !saving;

    useEffect(() => {
        onDirtyChange(dirty);
        return () => onDirtyChange(false);
    }, [dirty, onDirtyChange]);

    async function cancel() {
        if (dirty && !(await confirm({
            title: 'Discard changes?',
            message: 'Your changes to this Side Pattern will be lost.',
            confirmLabel: 'Discard',
            destructive: true,
        }))) {
            return;
        }
        onCancel();
    }

    const outIds = new Set(draft.cardsOut.map((e) => e.card.id));
    const inIds = new Set(draft.cardsIn.map((e) => e.card.id));

    return (
        <div className='space-y-5'>
            <div className={`${panelStyles} grid gap-4 p-panel sm:grid-cols-2`}>
                <Field label='Opponent deck'>
                    {(control) => (
                        <Input
                            {...control}
                            value={draft.opponentDeckName}
                            onChange={(e) =>
                                setDraft({ ...draft, opponentDeckName: e.target.value })
                            }
                            maxLength={100}
                            placeholder='e.g. Snake-Eye'
                        />
                    )}
                </Field>
                <Field label='Notes (optional)'>
                    {(control) => (
                        <Input
                            {...control}
                            value={draft.notes}
                            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                        />
                    )}
                </Field>
            </div>

            {decklistDirty && (
                <Notice>The Decklist has unsaved changes. Side Patterns use the saved decklist.</Notice>
            )}

            {pools.length === 0 && (
                <Notice tone='info'>Add cards to the Side Deck (and save the Decklist) to build a Pattern.</Notice>
            )}

            {pools.map((pool) => {
                const t = totals[pool.lane];
                const ok = t.outCount === t.inCount;
                return (
                    <Panel
                        key={pool.lane}
                        title={LANE_LABEL[pool.lane]}
                        actions={
                            <Badge tone={ok ? 'success' : 'danger'}>
                                Out {t.outCount} / In {t.inCount}
                                {ok ? ' ✓' : ' ✗'}
                            </Badge>
                        }
                    >
                        <div className='grid gap-6 md:grid-cols-2'>
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
                    </Panel>
                );
            })}

            {error && <ErrorMessage>{error}</ErrorMessage>}

            <div className='flex gap-2'>
                <Button variant='primary' disabled={!canSave} onClick={() => onSave(draft)}>
                    {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button variant='ghost' onClick={() => void cancel()}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}