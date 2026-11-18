import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDeck, listDecks } from '../api';
import WthCardSearch from './WthCardSearch';
import { addCopy, canAddCopy, comboProblems, COMBO_DECK_UI, deckCounts, handCopies, importDeckCards, isSameComboDraft, removeCopy, setHandCopies, type ComboDraft, type DraftCard } from '../comboDraft';
import ComboStepRecorder from './ComboStepRecorder';
import { useConfirm } from '../confirm/useConfirm';
import CardTile from './CardTile';
import { Button } from '../ui/Button';
import { Field, Input, Select } from '../ui/Field';
import { BoltIcon, CheckIcon, CloseIcon, DeckIcon, PlusIcon } from '../ui/icons';
import { Panel } from '../ui/Panel';
import { ErrorMessage, Notice } from '../ui/States';
import { Stepper } from '../ui/Stepper';
import { cn, panelStyles } from '../ui/styles';
import { Tabs } from '../ui/Tabs';

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
        <li className='flex w-card-sm flex-col items-center gap-1.5 text-center sm:w-card-md'>
            <div className='w-full'>
                <CardTile card={entry.card}></CardTile>
            </div>
            <span className='block w-full truncate text-micro text-ink-muted' title={entry.card.name}>
                {entry.card.name}
            </span>
            <Stepper itemLabel={entry.card.name} onDecrement={onRemove} onIncrement={onAdd} incrementDisabled={!canAdd}>
                {entry.quantity}
            </Stepper>
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
            <div className={`${panelStyles} grid gap-4 p-panel sm:grid-cols-2`}>
                <Field label='Name'>
                    {(control) => (
                        <Input
                            {...control}
                            value={draft.name}
                            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                            maxLength={100}
                            placeholder='e.g. Snake-Eye 1-card combo'
                        >
                        </Input>
                    )}
                </Field>
                <Field label='Description (optional)'>
                    {(control) => (
                        <Input
                            {...control}
                            value={draft.description}
                            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                            maxLength={1000}
                        >
                        </Input>
                    )}
                </Field>
            </div>

            <Tabs<'setup' | 'steps'>
                label='Combo editor'
                tabs={[
                    { id: 'setup', label: 'Setup', icon: DeckIcon },
                    { id: 'steps', label: `Steps (${draft.steps.length})`, icon: BoltIcon },
                ]}
                value={tab}
                onChange={setTab}
            ></Tabs>

            <div role='tabpanel' className={tab === 'setup' ? 'space-y-6' : 'hidden'}>
                <Panel
                    title='Decklist'
                    actions={
                        <span className='numeric text-caption text-ink-subtle'>
                            <span className='text-zone-main'>Main</span> {counts.MAIN}/{COMBO_DECK_UI.mainMax} · <span className='text-zone-extra'>Extra</span> {counts.EXTRA}/{COMBO_DECK_UI.extraMax}
                        </span>
                    }
                >
                    <div className='space-y-5'>
                        <div className='flex flex-wrap items-center gap-2'>
                            <Button size='sm' variant={searching ? 'secondary' : 'primary'} onClick={() => setSearching((s) => !s)}>
                                {searching ? <CloseIcon className='size-4' /> : <PlusIcon className='size-4' />}
                                {searching ? 'Hide search' : 'Add cards'}
                            </Button>
                            <span className='mx-1 hidden h-6 w-px bg-line sm:block'></span>
                            <div className='min-w-0 flex-1 sm:max-w-64'>
                                <Select
                                    value={importId}
                                    onChange={(e) => setImportId(e.target.value)}
                                    aria-label='Import from a deck'
                                    className='h-8 py-0 text-caption'
                                >
                                    <option value=''>Import from a deck...</option>
                                    {decks.data?.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.name}
                                        </option>
                                    ))}
                                </Select>
                            </div>
                            <Button size='sm' onClick={importDeck} disabled={importId === ''}>
                                Import
                            </Button>
                        </div>
                        {importError && <ErrorMessage>{importError}</ErrorMessage>}

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
                            <p className='rounded-control border border-dashed border-line-strong py-8 text-center text-sm text-ink-faint'>
                                No Cards yet: add some or import a deck.
                            </p>
                        )}
                        {mainCards.length > 0 && (
                            <div>
                                <h3 className='label mb-3 text-zone-main'>Main Deck</h3>
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
                                <h3 className='label mb-3 text-zone-extra'>Extra Deck</h3>
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
                    </div>
                </Panel>

                <Panel
                    title='Starting Hand'
                    actions={
                        <span className='numeric text-caption text-ink-subtle'>
                            <span className='text-ink'>{draft.startingHand.length}</span>/{COMBO_DECK_UI.maxHand} cards
                        </span>
                    }
                >
                    {mainCards.length === 0 ? (
                        <p className='text-sm text-ink-subtle'>Add Main Deck cards to choose the hand.</p>
                    ) : (
                        <ul className='flex flex-wrap gap-3'>
                            {mainCards.map((e) => {
                                const inHand = handCopies(draft, e.card.id);
                                return (
                                    <li key={e.card.id} className='flex w-card-sm flex-col items-center gap-1.5 sm:w-card-md'>
                                        <div className={cn('w-full rounded-card ring-2 transition-[box-shadow,opacity]', inHand > 0 ? 'ring-primary' : 'opacity-60 ring-transparent')}>
                                            <CardTile card={e.card}></CardTile>
                                        </div>
                                        <Stepper
                                            itemLabel={e.card.name}
                                            decrementLabel={`Remove one copy of ${e.card.name} from the hand`}
                                            incrementLabel={`Add one copy of ${e.card.name} to the hand`}
                                            onDecrement={() => setDraft(setHandCopies(draft, e.card.id, inHand - 1))}
                                            onIncrement={() => setDraft(setHandCopies(draft, e.card.id, inHand + 1))}
                                            decrementDisabled={inHand === 0}
                                            incrementDisabled={
                                                inHand >= e.quantity ||
                                                draft.startingHand.length >= COMBO_DECK_UI.maxHand
                                            }
                                        >
                                            {inHand}/{e.quantity}
                                        </Stepper>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Panel>
            </div>

            <div role='tabpanel' className={tab === 'steps' ? '' : 'hidden'}>
                <ComboStepRecorder
                    key={JSON.stringify([draft.cards.map((c) => [c.card.id, c.quantity]), draft.startingHand])}
                    draft={draft}
                    onStepsChange={(steps) => setDraft((d) => ({ ...d, steps}))}
                >
                </ComboStepRecorder>
            </div>

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