import { useEffect, useMemo, useState } from 'react';
import { cardImageUrl } from '../api';
import ComboBoard from './ComboBoard';
import { entriesOf, type ComboDraft } from '../comboDraft';
import { COMBO_LIMITS, replay, STEP_KINDS, type ComboStep, type Move, type StepKind, type Zone } from '../comboEngine';
import { changedInstances, KIND_LABEL, cardOfInstance, materialsOf, stepTitle } from '../comboPlayback';
import { boardWithMoves, commitPending, describeMove, emptyPending, flipMove, removeStepsFrom, resolveZoneClick, tryAddMove, turnMove, ZONE_LABEL, type PendingStep } from '../comboRecorder';
import type { Card } from '../types';

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

    function deleteFrom(index: number) {
        const after = draft.steps.length - index - 1;
        const text = after === 0
            ? `Delete step ${index + 1}?`
            : `Delete step ${index + 1} and the ${after} step${after === 1 ? '' : 's'} after it?`;
        if (!window.confirm(text)) {
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
            <div className='space-y-3'>
                {draft.cards.length === 0 && (
                    <p className='text-sm text-gray-500'>Add cards to the decklist (Setup) before recording steps.</p>
                )}
                {result.errors.length > 0 && (
                    <p className='whitespace-pre-line rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700'>
                        The steps already added no longer work with the decklist or the hand:{'\n'}
                        {result.errors.join('\n')}
                        {'\n'}Fix the Setup or delete the steps from the list.
                    </p>
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

                        {message && <p className='text-sm text-red-700'>{message}</p>}

                        <div className='rounded border p-3' data-keep-selection>
                            {selectedCard ? (
                                <div className='space-y-2'>
                                    <p className='text-sm'>
                                        <span className='font-semibold'>
                                            {cards.get(selectedCard.cardId)?.name ?? selectedCard.id}
                                        </span>
                                        <span className='ml-2 text-gray-500'>
                                            {ZONE_LABEL[selectedCard.zone]},{' '}
                                            {selectedCard.face === 'UP' ? 'face-up' : 'face-down'},{' '}
                                            {selectedCard.position === 'ATK' ? 'attack' : 'defense'}
                                        </span>
                                    </p>
                                    <div className='flex flex-wrap gap-2 text-sm'>
                                        <button
                                            type='button'
                                            onClick={() => addMove(flipMove(selectedCard))}
                                            className='rounded border px-2 py-1'
                                        >
                                            Flip face
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() => addMove(turnMove(selectedCard))}
                                            className='rounded border px-2 py-1'
                                        >
                                            ATK / DEF
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() => setAttaching((a) => !a)}
                                            className={`rounded border px-2 py-1 ${attaching ? 'bg-blue-100' : ''}`}
                                        >
                                            {attaching ? 'Click the monster...' : 'Attach as material'}
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() => setPending({ ...pending, source: selectedCard.id })}
                                            className='rounded border px-2 py-1'
                                        >
                                            Use as source
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() => {
                                                setSelectedId(null);
                                                setAttaching(false);
                                            }}
                                            className='rounded border px-2 py-1'
                                        >
                                            Deselect
                                        </button>
                                    </div>
                                    {materials.length > 0 && (
                                        <div>
                                            <p className='text-xs font-semibold uppercase text-gray-500'>
                                                Attached materials
                                            </p>
                                            <ul className='mt-1 flex flex-wrap gap-2'>
                                                {materials.map((m) => (
                                                    <li key={m.id}>
                                                        <button
                                                            type='button'
                                                            onClick={() => selectCard(m.id)}
                                                            className='w-14'
                                                            title={cards.get(m.cardId)?.name}
                                                        >
                                                            <img
                                                                src={cardImageUrl(m.cardId)}
                                                                alt={cards.get(m.cardId)?.name ?? 'Material'}
                                                                draggable={false}
                                                                className='w-full'
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
                                <p className='text-sm text-gray-500'>
                                    Click a card to select it, then click the zone where it goes. Click the
                                    Deck, the Extra Deck, the Graveyard or the Banished pile to see its cards.
                                    Click anywhere else to deselect.
                                </p>
                            )}
                        </div>

                        {browsing && (
                            <div className='rounded border border-blue-300 bg-blue-50 p-3' data-keep-selection>
                                <div className='mb-2 flex items-center justify-between'>
                                    <h3 className='text-sm font-semibold'>
                                        {ZONE_LABEL[browsing]} ({browsed.length})
                                    </h3>
                                    <button
                                        type='button'
                                        onClick={() => setBrowsing(null)}
                                        className='text-sm underline'
                                    >
                                        Close
                                    </button>
                                </div>
                                {browsed.length === 0 ? (
                                    <p className='text-sm text-gray-500'>Empty.</p>
                                ) : (
                                    <ul className='flex flex-wrap gap-2'>
                                        {browsed.map((c) => (
                                            <li key={c.id}>
                                                <button
                                                    type='button'
                                                    onClick={() => selectCard(c.id)}
                                                    title={cards.get(c.cardId)?.name}
                                                    className={`w-16 rounded border bg-white p-0.5 ${
                                                        c.id === selectedId ? 'border-blue-500' : 'border-gray-300'
                                                    }`}
                                                >
                                                    <img
                                                        src={cardImageUrl(c.cardId)}
                                                        alt={cards.get(c.cardId)?.name ?? 'Card'}
                                                        draggable={false}
                                                        className='w-full'
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
                    <section className='space-y-2 rounded border p-3'>
                        <h3 className='font-semibold'>New step {draft.steps.length + 1}</h3>
                        <label className='block text-sm'>
                            Action
                            <select
                                value={pending.kind}
                                onChange={(e) => setPending({ ...pending, kind: e.target.value as StepKind })}
                                className='mt-1 w-full rounded border px-2 py-1'
                            >
                                {STEP_KINDS.map((k) => (
                                    <option key={k} value={k}>
                                        {KIND_LABEL[k]}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div className='flex items-center gap-2 text-sm'>
                            <span>Source:</span>
                            <span className='font-semibold'>{sourceName ?? (pending.source ? '?' : 'none')}</span>
                            {pending.source && (
                                <button
                                    type='button'
                                    onClick={() => setPending({ ...pending, source: null })}
                                    className='text-xs underline'
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <label className='block text-sm'>
                            Note
                            <textarea
                                value={pending.note}
                                onChange={(e) => setPending({ ...pending, note: e.target.value })}
                                maxLength={COMBO_LIMITS.maxNote}
                                rows={2}
                                placeholder='e.g. Search Snake-Eye Poplar'
                                className='mt-1 w-full rounded border px-2 py-1'
                            />
                        </label>

                        <div className='text-sm'>
                            <p className='font-semibold'>Moves ({pending.moves.length})</p>
                            {pending.moves.length === 0 ? (
                                <p className='text-gray-500'>
                                    None yet. A step with no moves is fine (e.g. an effect that changes nothing).
                                </p>
                            ) : (
                                <ol className='list-decimal pl-5'>
                                    {pending.moves.map((m, i) => (
                                        <li key={i}>{describeMove(m, cards)}</li>
                                    ))}
                                </ol>
                            )}
                        </div>

                        <div className='flex flex-wrap gap-2'>
                            <button
                                type='button'
                                onClick={addStep}
                                disabled={draft.steps.length >= COMBO_LIMITS.maxSteps}
                                className='rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-40'
                            >
                                Add Step
                            </button>
                            <button
                                type='button'
                                disabled={pending.moves.length === 0}
                                onClick={() =>
                                    setPending({ ...pending, moves: pending.moves.slice(0, -1) })
                                }
                                className='rounded border px-3 py-1 disabled:opacity-40'
                            >
                                Undo last move
                            </button>
                            <button
                                type='button'
                                onClick={() => {
                                    setPending(emptyPending());
                                    setMessage(null);
                                }}
                                className='rounded border px-3 py-1'
                            >
                                Clear step
                            </button>
                        </div>
                    </section>
                )}

                <section>
                    <h3 className='mb-1 font-semibold'>Steps ({draft.steps.length})</h3>
                    {draft.steps.length === 0 ? (
                        <p className='text-sm text-gray-500'>No Steps yet.</p>
                    ) : (
                        <ol className='space-y-1 text-sm'>
                            {draft.steps.map((s, i) => (
                                <li key={i} className='flex items-start justify-between gap-2 rounded border p-2'>
                                    <div>
                                        <p className='font-semibold'>
                                            {i + 1}. {stepTitle(s, cards)}
                                        </p>
                                        {s.note && <p className='text-gray-600'>{s.note}</p>}
                                        <p className='text-xs text-gray-400'>
                                            {s.moves.length} move{s.moves.length === 1 ? '' : 's'}
                                        </p>
                                    </div>
                                    <button
                                        type='button'
                                        onClick={() => deleteFrom(i)}
                                        className='text-xs text-red-700 underline'
                                    >
                                        {i === draft.steps.length - 1 ? 'Delete' : 'Delete from here'}
                                    </button>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>
            </div>
        </div>
    );
}