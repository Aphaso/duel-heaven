import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cardImageUrl, getDeck, listDecks } from '../api';
import WthCardSearch from './WthCardSearch';
import { addCopy, canAddCopy, comboProblems, COMBO_DECK_UI, deckCounts, handCopies, importDeckCards, isSameComboDraft, removeCopy, setHandCopies, type ComboDraft, type DraftCard } from '../comboDraft';
import ComboStepRecorder from './ComboStepRecorder';
import { useConfirm } from '../confirm/useConfirm';

interface Props {
    initial: ComboDraft;
    saving: boolean;
    error: string | null;
    onSave: (draft: ComboDraft) => void;
    onDirtyChange: (dirty: boolean) => void;
}

function DeckTile({
    entry,
    canAdd,
    onAdd,
    onRemove,
}: {
    entry: DraftCard;
    canAdd: boolean;
    onAdd: () => void;
    onRemove: () => void;
}) {
    return (
        <li className='w-20 text-center'>
            <img src={cardImageUrl(entry.card.id)} alt={entry.card.name} draggable={false} className='w-full' />
            <span className='block truncate text-xs' title={entry.card.name}>
                {entry.card.name}
            </span>
            <div className='flex items-center justify-center gap-1 text-sm'>
                <button type='button' onClick={onRemove} className='rounded border px-1.5'>
                    −
                </button>
                <span>{entry.quantity}</span>
                <button
                    type='button'
                    onClick={onAdd}
                    disabled={!canAdd}
                    className='rounded border px-1.5 disabled:opacity-30'
                >
                    +
                </button>
            </div>
        </li>
    );
}

export default function ComboEditor({ initial, saving, error, onSave, onDirtyChange }: Props) {
    const queryClient = useQueryClient();
    const confirm = useConfirm();
    const [draft, setDraft] = useState<ComboDraft>(initial);
    const [searching, setSearching] = useState(false);
    const [importId, setImportId] = useState('');
    const [importError, setImportError] = useState<string | null>(null);
    const [tab, setTab] = useState<'setup' | 'steps'>('setup');

    const dirty = !isSameComboDraft(draft, initial);
    const problems = useMemo(() => comboProblems(draft), [draft]);
    const canSave = dirty && problems.length === 0 && !saving;
    const counts = deckCounts(draft);

    useEffect(() => {
        onDirtyChange(dirty);
        return () => onDirtyChange(false);
    }, [dirty, onDirtyChange]);

    const decks = useQuery({ queryKey: ['decks'], queryFn: listDecks });

    async function importDeck() {
        if (importId === '') {
            return;
        }
        if (
            draft.cards.length > 0 &&
            !(await confirm({
                title: 'Replace the decklist?',
                message: 'The starting hand and the steps will be cleared.',
                confirmLabel: 'Replace',
                destructive: true,
            }))
        ) {
            return;
        }
        setImportError(null);
        try {
            const deck = await queryClient.fetchQuery({
                queryKey: ['deck', importId],
                queryFn: () => getDeck(importId),
            });
            setDraft((d) => importDeckCards(d, deck.cards));
        } catch (e) {
            setImportError(e instanceof Error ? e.message : 'Could not import the Deck');
        }
    }

    const mainCards = draft.cards.filter((c) => c.section === 'MAIN');
    const extraCards = draft.cards.filter((c) => c.section === 'EXTRA');
    // Cards that cannot take another copy are disabled in the search
    const fullIds = new Set(draft.cards.filter((c) => !canAddCopy(draft, c.card)).map((c) => c.card.id));

    return (
        <div className='space-y-6'>
            <div className='grid gap-3 sm:grid-cols-2'>
                <label className='block text-sm'>
                    Name
                    <input
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        maxLength={100}
                        className='mt-1 w-full rounded border px-2 py-1'
                    >
                    </input>
                </label>
                <label className='block text-sm'>
                    Description (optional)
                    <input
                        value={draft.description}
                        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                        maxLength={1000}
                        className='mt-1 w-full rounded border px-2 py-1'
                    >
                    </input>
                </label>
            </div>

            <div role='tablist' className='flex gap-1 border-b border-gray-200'>
                {(['setup', 'steps'] as const).map((t) => (
                    <button
                        key={t}
                        type='button'
                        role='tab'
                        aria-selected={tab === t}
                        onClick={() => setTab(t)}
                        className={`-mb-px border-b-2 px-4 py-2 text-sm ${
                            tab === t
                                ? 'border-blue-600 font-semibold text-blue-700'
                                : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        {t === 'setup' ? 'Setup' : `Steps (${draft.steps.length})`}
                    </button>
                ))}
            </div>

            <div className={tab === 'setup' ? 'space--y-6' : 'hidden'}>
                <section className='space-y-3'>
                    <div className='flex flex-wrap items-center gap-3'>
                        <h2 className='text-lg font-semibold'>Decklist</h2>
                        <span className='text-sm text-gray-500'>
                            Main {counts.MAIN}/{COMBO_DECK_UI.mainMax} · Extra {counts.EXTRA}/{COMBO_DECK_UI.extraMax}
                        </span>
                        <button
                            type='button'
                            onClick={() => setSearching((s) => !s)}
                            className='rounded border px-3 py-1 text-sm'
                        >
                            {searching ? 'Hide search' : '+ Add cards'}
                        </button>
                        <select
                            value={importId}
                            onChange={(e) => setImportId(e.target.value)}
                            className='rounded border px-2 py-1 text-sm'
                        >
                        <option value=''>Import from a deck...</option>
                        {decks.data?.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.name}
                            </option>
                        ))}
                        </select>
                        <button
                            type='button'
                            onClick={importDeck}
                            disabled={importId === ''}
                            className='rounded border px-3 py-1 text-sm disabled:opacity-40'
                        >
                            Import
                        </button>
                    </div>
                    {importError && <p className='text-sm text-red-700'>{importError}</p>}

                    {searching && (
                        <WthCardSearch
                            title='Add Cards to the combo'
                            disabledIds={fullIds}
                            onPick={(card) => setDraft((d) => addCopy(d, card))}
                            onClose={() => setSearching(false)}
                        >
                        </WthCardSearch>
                    )}

                    {draft.cards.length === 0 && (
                        <p className='text-sm text-gray-500'>No Cards yet: add some or import a deck.</p>
                    )}
                    {mainCards.length > 0 && (
                        <div>
                            <h3 className='mb-1 text-sm font-semibold'>Main Deck</h3>
                            <ul className='flex flex-wrap gap-3'>
                                {mainCards.map((e) => (
                                    <DeckTile
                                        key={e.card.id}
                                        entry={e}
                                        canAdd={canAddCopy(draft, e.card)}
                                        onAdd={() => setDraft(addCopy(draft, e.card))}
                                        onRemove={() => setDraft(removeCopy(draft, e.card.id))}
                                    >
                                    </DeckTile>
                                ))}
                            </ul>
                        </div>
                    )}
                    {extraCards.length > 0 && (
                        <div>
                            <h3 className='mb-1 text-sm font-semibold'>Extra Deck</h3>
                            <ul className='flex flex-wrap gap-3'>
                                {extraCards.map((e) => (
                                    <DeckTile
                                        key={e.card.id}
                                        entry={e}
                                        canAdd={canAddCopy(draft, e.card)}
                                        onAdd={() => setDraft(addCopy(draft, e.card))}
                                        onRemove={() => setDraft(removeCopy(draft, e.card.id))}
                                    >
                                    </DeckTile>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>

                <section className='space-y-2'>
                    <h2 className='text-lg font-semibold'>
                        Starting Hand
                        <span className='ml-2 text-sm font-normal text-gray-500'>
                            {draft.startingHand.length}/{COMBO_DECK_UI.maxHand} cards
                        </span>
                    </h2>
                    {mainCards.length === 0 ? (
                        <p className='text-sm text-gray-500'>Add Main Deck cards to choose the hand.</p>
                    ) : (
                        <ul className='flex flex-wrap gap-3'>
                            {mainCards.map((e) => {
                                const inHand = handCopies(draft, e.card.id);
                                return (
                                    <li
                                        key={e.card.id}
                                        className={`w-20 rounded border p-1 text-center ${
                                            inHand > 0 ? 'border-blue-500' : 'border-gray-200'
                                        }`}
                                    >
                                        <img
                                            src={cardImageUrl(e.card.id)}
                                            alt={e.card.name}
                                            draggable={false}
                                            className='w-full'
                                        >
                                        </img>
                                        <div className='flex items-center justify-center gap-1 text-sm'>
                                            <button
                                                type='button'
                                                disabled={inHand === 0}
                                                onClick={() => setDraft(setHandCopies(draft, e.card.id, inHand - 1))}
                                                className='rounded border px-1.5 disabled:opacity-30'
                                            >
                                                −
                                            </button>
                                            <span>
                                                {inHand}/{e.quantity}
                                            </span>
                                            <button
                                                type='button'
                                                disabled={
                                                    inHand >= e.quantity ||
                                                    draft.startingHand.length >= COMBO_DECK_UI.maxHand
                                                }
                                                onClick={() => setDraft(setHandCopies(draft, e.card.id, inHand + 1))}
                                                className='rounded border px-1.5 disabled:opacity-30'
                                            >
                                                +
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>

            <div className={tab === 'steps' ? '' : 'hidden'}>
                <ComboStepRecorder
                    key={JSON.stringify([draft.cards.map((c) => [c.card.id, c.quantity]), draft.startingHand])}
                    draft={draft}
                    onStepsChange={(steps) => setDraft((d) => ({ ...d, steps}))}
                >
                </ComboStepRecorder>
            </div>

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
                {dirty ? (
                    <span className='text-sm text-amber-700'>Unsaved Changes</span>
                ) : (
                    <span className='text-sm text-gray-500'>Saved</span>
                )}
            </div>
        </div>
    );
}