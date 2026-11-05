import { useState, type SyntheticEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDeck } from '../api';
import type { DeckDetail } from '../types';

export default function DeckDetailsForm({ deck }: { deck: DeckDetail }) {
    const quertClient = useQueryClient();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState('');
    const [archetype, setArchetype] = useState('');

    const update = useMutation({
        mutationFn: () => updateDeck(deck.id, { name: name.trim(), archetype: archetype.trim() || null }),
        onSuccess: (updated) => {
            quertClient.setQueryData(['deck', deck.id], updated);
            quertClient.invalidateQueries({ queryKey: ['decks'] });
            setEditing(false);
        }
    });

    function startEditing() {
        // Start the fields from the values currently saved
        setName(deck.name);
        setArchetype(deck.archetype ?? '');
        update.reset();
        setEditing(true);
    }

    function cancel() {
        update.reset();
        setEditing(false);
    }

    function handleSubmit(e: SyntheticEvent) {
        e.preventDefault();
        update.mutate();
    }

    const unchanged = name.trim() === deck.name && (archetype.trim() || null) === deck.archetype;

    if (!editing) {
        return (
            <div className='flex flex-wrap items-start justify-between gap-3'>
                <div className='min-w-0'>
                    <h1 className='break-words text-3xl font-bold'>{deck.name}</h1>
                    {deck.archetype && <p className='mt-1 text-gray-600'>{deck.archetype}</p>}
                </div>
                <button onClick={startEditing} className='rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100'>
                    Edit
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className='rounded border border-gray-200 p-4'>
            <label className='block text-sm font-medium'>
                Deck Name
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className='mt-1 w-full rounded border border-gray-300 px-3 py-2 font-normal'></input>
            </label>
            <label className='mt-3 block text-sm font-medium'>
                Archetype (Optional)
                <input value={archetype} onChange={(e) => setArchetype(e.target.value)} maxLength={100} className='mt-1 w-full rounded border border-gray-300 px-3 py-2 font-normal'></input>
            </label>

            <div className='mt-4 flex gap-2'>
                <button type='submit' disabled={!name.trim() || unchanged || update.isPending} className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40'>
                    {update.isPending ? 'Saving...' : 'Save'}
                </button>
                <button type='button' onClick={cancel} disabled={update.isPending} className='rounded border border-gray-300 px-4 py-2 hover:bg-gray-100 disabled:opacity-40'>
                    Cancel
                </button>
            </div>

            {update.isError && <p className='mt-3 whitespace-pre-line text-sm text-red-600'>{update.error.message}</p>}
        </form>
    );
}