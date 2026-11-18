import { useEffect, useMemo, useState } from 'react';
import { cardImageUrl } from '../api';
import ComboBoard from './ComboBoard';
import { entriesOf, type ComboDraft } from '../comboDraft';
import { COMBO_LIMITS, replay, STEP_KINDS, type ComboStep, type Move, type StepKind, type Zone } from '../comboEngine';
import { changedInstances, KIND_LABEL, cardOfInstance, materialsOf, stepTitle } from '../comboPlayback';
import { boardWithMoves, commitPending, describeMove, emptyPending, flipMove, removeStepsFrom, resolveZoneClick, tryAddMove, turnMove, ZONE_LABEL, type PendingStep } from '../comboRecorder';
import type { Card } from '../types';
import { useConfirm } from '../confirm/useConfirm';
import { Button } from '../ui/Button';
import { Field, Select, Textarea } from '../ui/Field';
import { CloseIcon, PlusIcon, TrashIcon, UndoIcon } from '../ui/icons';
import { Panel } from '../ui/Panel';
import { ErrorMessage, Notice } from '../ui/States';
import { cn, panelStyles } from '../ui/styles';

interface Props {
    draft: ComboDraft;
    onStepsChange: (steps: ComboStep[]) => void;
}

export default function ComboStepRecorder({ draft, onStepsChange }: Props) {
    const [pending, setPending] = useState<PendingStep>(emptyPending);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [attaching, setAttaching] = useState(false);
    const [browsing, setBrowsing] = useState<Zone | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const confirm = useConfirm();

    // A click anywhere outside the cards, the zones and the panels of the selected card deselects it.
    // The areas to keep are marked with the attribute data-keep-selection
    useEffect(() => {
        function onClick(event: MouseEvent) {
            // composedPath() is the path of the click as it was when it happened.
            // It still works if React has already replaced the element that was clicked.
            const inside = event.composedPath().some((node) => node instanceof Element && node.hasAttribute('data-keep-selection'));
            if (!inside) {
                setSelectedId(null);
                setAttaching(false);
            }
        }
        document.addEventListener('click', onClick);
        return () => document.removeEventListener('click', onClick);
    }, []);

    const cards = useMemo(
        () => new Map<number, Card>(draft.cards.map((c) => [c.card.id, c.card])),
        [draft.cards],
    );

    // The board AFTER the steps already added: where the new step starts from
    const result = useMemo(
        () => replay(entriesOf(draft), draft.startingHand, draft.steps),
        [draft],
    );
    const base = result.errors.length === 0 ? result.boards[result.boards.length - 1] : undefined;
    // ... and with the moves of the step being built
    const display = useMemo(
        () => (base ? boardWithMoves(base, pending.moves) : undefined),
        [base, pending.moves],
    );
    const changed = base && display ? changedInstances(base, display) : new Set<string>();

    const selectedCard = display?.find((c) => c.id === selectedId);
    const materials = display && selectedCard ? materialsOf(display, selectedCard.id) : [];
    const browsed = display && browsing ? display.filter((c) => c.zone === browsing) : [];

    function addMove(move: Move, deselect = true) {
        if (!base) {
            return;
        }
        const r = tryAddMove(base, pending.moves, move);
        if (r.error !== undefined) {
            setMessage(r.error);
            return;
        }
        setMessage(null);
        setAttaching(false);
        if (deselect) {
            setSelectedId(null);
        }
        setPending({ ...pending, moves: r.moves });
    }

    function zoneClick(zone: Zone) {
        if (!display) {
            return;
        }
        const r = resolveZoneClick(display, zone, selectedId, attaching);
        switch (r.type) {
            case 'move':
                addMove(r.move);
                break;
            case 'select':
                setSelectedId(r.instance);
                setAttaching(false);
                setMessage(null);
                break;
            case 'browse':
                setBrowsing(r.zone);
                break;
            case 'error':
                setMessage(r.message);
                break;
            case 'none':
                break;
        }
    }

    function selectCard(id: string) {
        setSelectedId(id === selectedId ? null : id);
        setAttaching(false);
        setMessage(null);
    }

    function addStep() {
        if (!base) {
            return;
        }
        const r = commitPending(base, pending);
        if (r.error !== undefined) {
            setMessage(r.error);
            return;
        }
        onStepsChange([...draft.steps, r.step]);
        setPending(emptyPending());
        setSelectedId(null);
        setAttaching(false);
        setBrowsing(null);
        setMessage(null);
    }

    async function deleteFrom(index: number) {
        const after = draft.steps.length - index - 1;
        const confirmed = await confirm({
            title:
                after === 0
                    ? `Delete step ${index + 1}?`
                    : `Delete step ${index + 1} and the ${after} step${after === 1 ? '' : 's'} after it?`,
            message: 'The combo chagnes only when you save it.',
            confirmLabel: 'Delete',
            destructive: true,
        });
        if (!confirmed) {
            return;
        }
        onStepsChange(removeStepsFrom(draft.steps, index));
        setPending(emptyPending());
        setSelectedId(null);
        setAttaching(false);
        setBrowsing(null);
        setMessage(null);
    }

    const sourceName = pending.source ? cardOfInstance(pending.source, cards)?.name : undefined;

    return (
        <div className='grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
            <div className='min-w-0 space-y-4'>
                {draft.cards.length === 0 && (
                    <Notice tone='info'>Add cards to the decklist (Setup) before recording steps.</Notice>
                )}
                {result.errors.length > 0 && (
                    <ErrorMessage>
                        The steps already added no longer work with the decklist or the hand:{'\n'}
                        {result.errors.join('\n')}
                        {'\n'}Fix the Setup or delete the steps from the list.
                    </ErrorMessage>
                )}

                {display && draft.cards.length > 0 && (
                    <>
                        <ComboBoard
                            board={display}
                            cards={cards}
                            changed={changed}
                            selected={selectedId}
                            onZoneClick={zoneClick}
                            onCardClick={selectCard}
                        >
                        </ComboBoard>

                        {message && <ErrorMessage>{message}</ErrorMessage>}

                        {/* Actions on the selected card */}
                        <div className={cn(panelStyles, 'p-4', selectedCard && 'border-aether-800')} data-keep-selection>
                            {selectedCard ? (
                                <div className='space-y-3'>
                                    <div className='flex flex-wrap items-baseline gap-x-3 gap-y-1'>
                                        <span className='label text-primary'>Selected</span>
                                        <span className='font-display text-heading text-ink'>
                                            {cards.get(selectedCard.cardId)?.name ?? selectedCard.id}
                                        </span>
                                        <span className='text-caption text-ink-subtle'>
                                            {ZONE_LABEL[selectedCard.zone]},{' '}
                                            {selectedCard.face === 'UP' ? 'face-up' : 'face-down'},{' '}
                                            {selectedCard.position === 'ATK' ? 'attack' : 'defense'}
                                        </span>
                                    </div>
                                    <div className='flex flex-wrap gap-2'>
                                        <Button size='sm' onClick={() => addMove(flipMove(selectedCard))}>
                                            Flip face
                                        </Button>
                                        <Button size='sm' onClick={() => addMove(turnMove(selectedCard))}>
                                            ATK / DEF
                                        </Button>
                                        <Button
                                            size='sm'
                                            onClick={() => setAttaching((a) => !a)}
                                            aria-pressed={attaching}
                                            className={attaching ? 'border-secondary bg-arcane-950 text-arcane-200 shadow-glow-secondary' : undefined}
                                        >
                                            {attaching ? 'Click the monster...' : 'Attach as material'}
                                        </Button>
                                        <Button size='sm' onClick={() => setPending({ ...pending, source: selectedCard.id })}>
                                            Use as source
                                        </Button>
                                        <Button
                                            size='sm'
                                            variant='ghost'
                                            onClick={() => {
                                                setSelectedId(null);
                                                setAttaching(false);
                                            }}
                                        >
                                            Deselect
                                        </Button>
                                    </div>
                                    {materials.length > 0 && (
                                        <div>
                                            <p className='label text-ink-subtle'>Attached materials</p>
                                            <ul className='mt-2 flex flex-wrap gap-2'>
                                                {materials.map((m) => (
                                                    <li key={m.id}>
                                                        <button
                                                            type='button'
                                                            onClick={() => selectCard(m.id)}
                                                            className='focus-ring block w-card-xs rounded-card transition-transform hover:-translate-y-0.5'
                                                            title={cards.get(m.cardId)?.name}
                                                        >
                                                            <img
                                                                src={cardImageUrl(m.cardId)}
                                                                alt={cards.get(m.cardId)?.name ?? 'Material'}
                                                                draggable={false}
                                                                className='w-full rounded-card shadow-card'
                                                            >
                                                            </img>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className='text-sm text-ink-subtle'>
                                    Click a card to select it, then click the zone where it goes. Click the
                                    Deck, the Extra Deck, the Graveyard or the Banished pile to see its cards.
                                    Click anywhere else to deselect.
                                </p>
                            )}
                        </div>

                        {/* Content of a pile (Deck, Extra, GY, Banished) */}
                        {browsing && (
                            <div className='animate-rise-in space-y-3 rounded-panel border border-aether-900 bg-aether-950/30 p-4' data-keep-selection>
                                <div className='flex items-center justify-between'>
                                    <h3 className='label text-aether-300'>
                                        {ZONE_LABEL[browsing]} <span className='numeric text-ink-subtle'>({browsed.length})</span>
                                    </h3>
                                    <Button size='sm' variant='ghost' onClick={() => setBrowsing(null)}>
                                        <CloseIcon className='size-4' />
                                        Close
                                    </Button>
                                </div>
                                {browsed.length === 0 ? (
                                    <p className='text-sm text-ink-subtle'>Empty.</p>
                                ) : (
                                    <ul className='flex flex-wrap gap-2'>
                                        {browsed.map((c) => (
                                            <li key={c.id}>
                                                <button
                                                    type='button'
                                                    onClick={() => selectCard(c.id)}
                                                    title={cards.get(c.cardId)?.name}
                                                    className={cn(
                                                        'focus-ring block w-card-sm rounded-card ring-2 transition-[transform,box-shadow] hover:-translate-y-0.5',
                                                        c.id === selectedId ? 'ring-primary shadow-glow-primary' : 'ring-transparent',
                                                    )}
                                                >
                                                    <img
                                                        src={cardImageUrl(c.cardId)}
                                                        alt={cards.get(c.cardId)?.name ?? 'Card'}
                                                        draggable={false}
                                                        className='w-full rounded-card shadow-card'
                                                    >
                                                    </img>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className='space-y-4'>
                {base && (
                    <Panel
                        title={<>New step <span className='numeric text-ink'>{draft.steps.length + 1}</span></>}
                        className='border-arcane-900'
                    >
                        <div className='space-y-4'>
                            <Field label='Action'>
                                {(control) => (
                                    <Select
                                        {...control}
                                        value={pending.kind}
                                        onChange={(e) => setPending({ ...pending, kind: e.target.value as StepKind })}
                                    >
                                        {STEP_KINDS.map((k) => (
                                            <option key={k} value={k}>
                                                {KIND_LABEL[k]}
                                            </option>
                                        ))}
                                    </Select>
                                )}
                            </Field>
                            <div className='flex items-center gap-2 rounded-control border border-line bg-surface-sunken px-3 py-2 text-sm'>
                                <span className='label text-ink-subtle'>Source</span>
                                <span className={cn('min-w-0 flex-1 truncate', sourceName || pending.source ? 'font-semibold text-ink' : 'text-ink-faint')}>
                                    {sourceName ?? (pending.source ? '?' : 'none')}
                                </span>
                                {pending.source && (
                                    <button
                                        type='button'
                                        onClick={() => setPending({ ...pending, source: null })}
                                        className='focus-ring rounded text-caption text-ink-subtle underline-offset-2 hover:text-ink hover:underline'
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <Field label='Note'>
                                {(control) => (
                                    <Textarea
                                        {...control}
                                        value={pending.note}
                                        onChange={(e) => setPending({ ...pending, note: e.target.value })}
                                        maxLength={COMBO_LIMITS.maxNote}
                                        rows={2}
                                        placeholder='e.g. Search Snake-Eye Poplar'
                                        className='min-h-16'
                                    />
                                )}
                            </Field>

                            <div className='space-y-1.5'>
                                <p className='label text-ink-subtle'>
                                    Moves <span className='numeric text-ink-faint'>({pending.moves.length})</span>
                                </p>
                                {pending.moves.length === 0 ? (
                                    <p className='text-caption text-ink-faint'>
                                        None yet. A step with no moves is fine (e.g. an effect that changes nothing).
                                    </p>
                                ) : (
                                    <ol className='space-y-1'>
                                        {pending.moves.map((m, i) => (
                                            <li key={i} className='flex gap-2 rounded-control bg-surface-sunken px-2.5 py-1.5 text-caption text-ink-muted'>
                                                <span className='numeric text-arcane-300'>{i + 1}</span>
                                                {describeMove(m, cards)}
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </div>

                            <div className='flex flex-wrap gap-2'>
                                <Button
                                    size='sm'
                                    variant='primary'
                                    onClick={addStep}
                                    disabled={draft.steps.length >= COMBO_LIMITS.maxSteps}
                                >
                                    <PlusIcon className='size-4' />
                                    Add Step
                                </Button>
                                <Button
                                    size='sm'
                                    disabled={pending.moves.length === 0}
                                    onClick={() =>
                                        setPending({ ...pending, moves: pending.moves.slice(0, -1) })
                                    }
                                >
                                    <UndoIcon className='size-4' />
                                    Undo last move
                                </Button>
                                <Button
                                    size='sm'
                                    variant='ghost'
                                    onClick={() => {
                                        setPending(emptyPending());
                                        setMessage(null);
                                    }}
                                >
                                    Clear step
                                </Button>
                            </div>
                        </div>
                    </Panel>
                )}

                <Panel title='Steps' actions={<span className='numeric text-caption text-ink-subtle'>{draft.steps.length}</span>} flush>
                    {draft.steps.length === 0 ? (
                        <p className='p-panel text-sm text-ink-subtle'>No Steps yet.</p>
                    ) : (
                        <ol className='scrollbar-thin max-h-[50dvh] space-y-1 overflow-y-auto p-2'>
                            {draft.steps.map((s, i) => (
                                <li key={i} className='group flex items-start gap-3 rounded-control px-2 py-2 hover:bg-surface-hover'>
                                    <span className='numeric mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-arcane-900 text-micro font-bold text-arcane-200'>
                                        {i + 1}
                                    </span>
                                    <div className='min-w-0 flex-1'>
                                        <p className='text-sm font-semibold text-ink'>{stepTitle(s, cards)}</p>
                                        {s.note && <p className='text-caption text-ink-muted'>{s.note}</p>}
                                        <p className='numeric text-micro text-ink-faint'>
                                            {s.moves.length} move{s.moves.length === 1 ? '' : 's'}
                                        </p>
                                    </div>
                                    <button
                                        type='button'
                                        onClick={() => void deleteFrom(i)}
                                        aria-label={
                                            i === draft.steps.length - 1
                                                ? `Delete step ${i + 1}`
                                                : `Delete step ${i + 1} and the following steps`
                                        }
                                        title={
                                            i === draft.steps.length - 1
                                                ? 'Delete this step'
                                                : 'Delete this step and all the following ones'
                                        }
                                        className='focus-ring grid size-7 shrink-0 place-items-center rounded-control text-ink-faint transition-colors hover:bg-danger/10 hover:text-danger'
                                    >
                                        <TrashIcon className='size-4' />
                                    </button>
                                </li>
                            ))}
                        </ol>
                    )}
                </Panel>
            </div>
        </div>
    );
}