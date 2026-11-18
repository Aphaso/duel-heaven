import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { getConnectStatus, listCombos } from '../api';
import {
    addCombo,
    availableCombos,
    isSamePlaylistDraft,
    moveCombo,
    playlistProblems,
    removeCombo,
    shiftCombo,
    type PlaylistDraft,
} from '../playlistDraft';
import SortableRow from './SortableRow';
import { Button } from '../ui/Button';
import { Field, Input } from '../ui/Field';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from '../ui/icons';
import { Panel } from '../ui/Panel';
import { ErrorMessage, LoadingState, Notice } from '../ui/States';
import { cn, linkStyles, panelStyles } from '../ui/styles';
import { Switch } from '../ui/Switch';

interface Props {
    initial: PlaylistDraft;
    buyers: number;
    saving: boolean;
    error: string | null;
    onSave: (draft: PlaylistDraft) => void;
    onDirtyChange: (dirty: boolean) => void;
}

export default function PlaylistEditor({ initial, buyers, saving, error, onSave, onDirtyChange }: Props) {
    const [draft, setDraft] = useState<PlaylistDraft>(initial);

    const sensors = useSensors(
        // Start dragging after 6 pixels of movement
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    function handleDragEnd({ active, over }: DragEndEvent) {
        if (over && active.id !== over.id) {
            setDraft((d) => moveCombo(d, String(active.id), String(over.id)));
        }
    }

    const dirty = !isSamePlaylistDraft(draft, initial);
    const problems = playlistProblems(draft);
    const canSave = dirty && problems.length === 0 && !saving;

    useEffect(() => {
        onDirtyChange(dirty);
        return () => onDirtyChange(false);
    }, [dirty, onDirtyChange]);

    const combos = useQuery({ queryKey: ['combos'], queryFn: listCombos });
    // Only asked when the user wants to sell
    const connect = useQuery({
        queryKey: ['connect-status'],
        queryFn: getConnectStatus,
        enabled: draft.forSale,
    });
    const available = availableCombos(combos.data ?? [], draft);

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
                        />
                    )}
                </Field>
                <Field label='Description (optional)'>
                    {(control) => (
                        <Input
                            {...control}
                            value={draft.description}
                            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                            maxLength={1000}
                        />
                    )}
                </Field>
            </div>

            <section className={cn(panelStyles, 'space-y-4 p-panel', draft.forSale && 'holo-border')}>
                <Switch
                    checked={draft.forSale}
                    onChange={(forSale) => setDraft({ ...draft, forSale })}
                    label='Sell this Playlist in the Store'
                    description='Other Duelists can buy it and watch all its combos.'
                ></Switch>
                {draft.forSale && (
                    <div className='space-y-3 pl-14'>
                        <Field label='Price (EUR)' className='max-w-40'>
                            {(control) => (
                                <div className='relative'>
                                    <span aria-hidden='true' className='pointer-events-none absolute inset-y-0 left-3 grid place-items-center font-mono text-sm text-accent'>€</span>
                                    <Input
                                        {...control}
                                        value={draft.price}
                                        onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                                        inputMode='decimal'
                                        placeholder='4.99'
                                        className='numeric pl-7'
                                    >
                                    </Input>
                                </div>
                            )}
                        </Field>
                        {connect.data && !connect.data.ready && (
                            <Notice>
                                You cannot sell yet: set up your payments account first.{' '}
                                <Link to='/account/payments' className={linkStyles}>
                                    Go to Payments
                                </Link>
                            </Notice>
                        )}
                    </div>
                )}
                {buyers > 0 && (
                    <Notice tone='info'>
                        {buyers} {buyers === 1 ? 'person bought' : 'people bought'} this Playlist. They always
                        see your latest changes, including combos you remove, and a new price does not affect
                        what they paid. If you delete it, they keep a frozen copy of its last version.
                    </Notice>
                )}
            </section>

            <div className='grid gap-6 md:grid-cols-2'>
                <Panel title={<>In this Playlist <span className='numeric text-ink'>({draft.combos.length})</span></>}>
                    {draft.combos.length === 0 ? (
                        <p className='rounded-control border border-dashed border-line-strong py-8 text-center text-sm text-ink-faint'>
                            Empty: add Combos from the list on the right.
                        </p>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={draft.combos.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                                <ol className='space-y-1.5'>
                                    {draft.combos.map((c, i) => (
                                        <SortableRow key={c.id} id={c.id} name={c.name} disabled={saving}>
                                            <span className='numeric w-5 shrink-0 text-center text-caption text-ink-faint'>{i + 1}</span>
                                            <span className='min-w-0 flex-1'>
                                                <span className='block truncate text-sm font-semibold text-ink'>{c.name}</span>
                                                <span className='numeric text-micro text-ink-subtle'>{c.stepCount} steps</span>
                                            </span>
                                            <span className='flex shrink-0 items-center gap-0.5'>
                                                <Button
                                                    size='icon'
                                                    variant='ghost'
                                                    disabled={i === 0}
                                                    onClick={() => setDraft(shiftCombo(draft, i, -1))}
                                                    aria-label='Move up'
                                                    className='size-7'
                                                >
                                                    <ChevronUpIcon className='size-4' />
                                                </Button>
                                                <Button
                                                    size='icon'
                                                    variant='ghost'
                                                    disabled={i === draft.combos.length - 1}
                                                    onClick={() => setDraft(shiftCombo(draft, i, 1))}
                                                    aria-label='Move down'
                                                    className='size-7'
                                                >
                                                    <ChevronDownIcon className='size-4' />
                                                </Button>
                                                <Button
                                                    size='icon'
                                                    variant='danger-ghost'
                                                    onClick={() => setDraft(removeCombo(draft, c.id))}
                                                    aria-label={`Remove ${c.name}`}
                                                    title='Remove'
                                                    className='size-7'
                                                >
                                                    <TrashIcon className='size-4' />
                                                </Button>
                                            </span>
                                        </SortableRow>
                                    ))}
                                </ol>
                            </SortableContext>
                        </DndContext>
                    )}
                </Panel>

                <Panel title='Your Combos'>
                    {combos.isPending && <LoadingState></LoadingState>}
                    {combos.isError && <ErrorMessage>{combos.error.message}</ErrorMessage>}
                    {combos.data && available.length === 0 && (
                        <p className='text-sm text-ink-subtle'>
                            {combos.data.length === 0
                                ? 'You have no combos yet: create one first.'
                                : 'All your combos are already in this playlist.'}
                        </p>
                    )}
                    <ul className='space-y-1.5'>
                        {available.map((c) => (
                            <li key={c.id} className='flex items-center justify-between gap-2 rounded-control border border-line px-3 py-2 transition-colors hover:border-line-strong'>
                                <span className='min-w-0'>
                                    <span className='block truncate text-sm font-semibold text-ink'>{c.name}</span>
                                    <span className='numeric text-micro text-ink-subtle'>{c.stepCount} steps</span>
                                </span>
                                <Button size='sm' variant='ghost' onClick={() => setDraft(addCombo(draft, c))} className='text-primary'>
                                    <PlusIcon className='size-4' />
                                    Add
                                </Button>
                            </li>
                        ))}
                    </ul>
                </Panel>
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