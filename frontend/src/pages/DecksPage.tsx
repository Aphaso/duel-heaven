import { useState, type SyntheticEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { createDeck, deleteDeck, listDecks } from '../api';

export default function DecksPage() {
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [archetype, setArchetype] = useState('');

    const decks = useQuery({ queryKey: ['decks'], queryFn: listDecks });

    const create = useMutation({
        mutationFn: createDeck,
        onSuccess: () => {
            setName('');
            setArchetype('');
            queryClient.invalidateQueries({ queryKey: ['decks'] });
        },
    });

    const remove = useMutation({
        mutationFn: deleteDeck,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['decks'] }),
    });

    function handleSubmit(e: SyntheticEvent) {
        e.preventDefault();
        create.mutate({
            name: name.trim(),
            archetype: archetype.trim() || undefined,
        });
    }

    function handleDelete(id: string, deckName: string) {
        if (window.confirm(`Delete deck "${deckName}"?`)) {
            remove.mutate(id);
        }
    }

    return (
        <main className='mx-auto max-w-3xl p-8'>
            <h1 className='text-3xl font-bold'>My Decks</h1>

            <form onSubmit={handleSubmit} className='mt-6 flex flex-wrap gap-2'>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder='Name of the Deck' className='min-w-48 flex-1 rounded border border-gray-300 px-3 py-2'></input>
                <input value={archetype} onChange={(e) => setArchetype(e.target.value)} placeholder='Archetype (optional)' className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40'></input>
                <button type='submit' disabled={!name.trim() || create.isPending} className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40'>
                    {create.isPending ? 'Creating...' : 'Create Deck'}
                </button>
            </form>
            {create.isError && (
                <p className='mt-2 whitespace-pre-line text-red-600'>
                    {create.error.message}
                </p>
            )}

            {decks.isPending && <p className='mt-6 text-gray-500'>Loading...</p>}
            {decks.isError && (
                <p className='mt-6 text-red-600'>{decks.error.message}</p>
            )}
            {remove.isError && (
                <p className='mt-6 whitespace-pre-line text-red-600'>{remove.error.message}</p>
            )}

            {decks.data && decks.data.length === 0 && (
                <p className='mt-6 text-gray-600'>No Deck present</p>
            )}

            {decks.data && decks.data.length > 0 && (
                <ul className='mt-6 divide-y rounded border border-gray-200'>
                    {decks.data.map((deck) => (
                        <li key={deck.id} className='flex items-center justify-between gap-4 p-4'>
                            <Link to={`/decks/${deck.id}`} className='min-w-0 flex-1'>
                                <span className='block truncate font-medium hover:underline'>{deck.name}</span>
                                <span className='block text-sm text-gray-500'>
                                    {deck.archetype ?? 'No specified Archetype'} · updated on {' '}
                                    {new Date(deck.updatedAt).toLocaleDateString('it-IT')}
                                </span>
                            </Link>
                            <button onClick={() => handleDelete(deck.id, deck.name)} disabled={remove.isPending} className='rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-40'>
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    );
}