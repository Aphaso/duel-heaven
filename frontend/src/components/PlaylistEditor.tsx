import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listCombos } from '../api';
import {
    addCombo,
    availableCombos,
    isSamePlaylistDraft,
    playlistProblems,
    removeCombo,
    shiftCombo,
    type PlaylistDraft,
} from '../playlistDraft';

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

    const dirty = !isSamePlaylistDraft(draft, initial);
    const problems = playlistProblems(draft);
    const canSave = dirty && problems.length === 0 && !saving;

    useEffect(() => {
        onDirtyChange(dirty);
        return () => onDirtyChange(false);
    }, [dirty, onDirtyChange]);

    const combos = useQuery({ queryKey: ['combos'], queryFn: listCombos });
    const available = availableCombos(combos.data ?? [], draft);

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
                    />
                </label>
                <label className='block text-sm'>
                    Description (optional)
                    <input
                        value={draft.description}
                        onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                        maxLength={1000}
                        className='mt-1 w-full rounded border px-2 py-1'
                    />
                </label>
            </div>

            <section className='space-y-2 rounded border p-3'>
                <label className='flex items-center gap-2 text-sm font-semibold'>
                    <input
                        type='checkbox'
                        checked={draft.forSale}
                        onChange={(e) => setDraft({ ...draft, forSale: e.target.checked })}
                    >
                    </input>
                    Sell this Playlist in the Store
                </label>
                {draft.forSale && (
                    <label className='block text-sm'>
                        Price (EUR)
                        <input
                            value={draft.price}
                            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                            inputMode='decimal'
                            placeholder='4.99'
                            className='mt-1 block w-32 rounded border px-2 py-1'
                        >
                        </input>
                    </label>
                )}
                {buyers > 0 && (
                    <p className='text-sm text-gray-600'>
                        {buyers} {buyers === 1 ? 'person bought' : 'people bought'} this Playlist. They always
                        see your latest changes, including combos you remove, and a new price does not affect
                        what they paid. If you delete it, they keep a frozen copy of its last version.
                    </p>
                )}
            </section>

            <div className='grid gap-6 md:grid-cols-2'>
                <section>
                    <h2 className='mb-2 text-lg font-semibold'>In this Playlist ({draft.combos.length})</h2>
                    {draft.combos.length === 0 ? (
                        <p className='text-sm text-gray-500'>Empty: add Combos from the list on the right.</p>
                    ) : (
                        <ol className='space-y-1'>
                            {draft.combos.map((c, i) => (
                                <li key={c.id} className='flex items-center justify-between gap-2 rounded border p-2'>
                                    <span className='text-sm'>
                                        <span className='font-semibold'>
                                            {i + 1}. {c.name}
                                        </span>
                                        <span className='ml-2 text-gray-500'>{c.stepCount} steps</span>
                                    </span>
                                    <span className='flex gap-1 text-sm'>
                                        <button
                                            type='button'
                                            disabled={i === 0}
                                            onClick={() => setDraft(shiftCombo(draft, i, -1))}
                                            aria-label='Move up'
                                            className='rounded border px-2 disabled:opacity-30'
                                        >
                                            ▲
                                        </button>
                                        <button
                                            type='button'
                                            disabled={i === draft.combos.length - 1}
                                            onClick={() => setDraft(shiftCombo(draft, i, 1))}
                                            aria-label='Move down'
                                            className='rounded border px-2 disabled:opacity-30'
                                        >
                                            ▼
                                        </button>
                                        <button
                                            type='button'
                                            onClick={() => setDraft(removeCombo(draft, c.id))}
                                            className='rounded border border-red-600 px-2 text-red-700'
                                        >
                                            Remove
                                        </button>
                                    </span>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                <section>
                    <h2 className='mb-2 text-lg font-semibold'>Your Combos</h2>
                    {combos.isPending && <p className='text-sm text-gray-500'>Loading...</p>}
                    {combos.isError && <p className='text-sm text-red-700'>{combos.error.message}</p>}
                    {combos.data && available.length === 0 && (
                        <p className='text-sm text-gray-500'>
                            {combos.data.length === 0
                                ? 'You have no combos yet: create one first.'
                                : 'All your combos are already in this playlist.'}
                        </p>
                    )}
                    <ul className='space-y-1'>
                        {available.map((c) => (
                            <li key={c.id} className='flex items-center justify-between gap-2 rounded border p-2'>
                                <span className='text-sm'>
                                    <span className='font-semibold'>{c.name}</span>
                                    <span className='ml-2 text-gray-500'>{c.stepCount} steps</span>
                                </span>
                                <button
                                    type='button'
                                    onClick={() => setDraft(addCombo(draft, c))}
                                    className='rounded border px-2 text-sm'
                                >
                                    Add
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
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