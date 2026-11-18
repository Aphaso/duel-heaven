import { useState, type SyntheticEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDeck } from '../api';
import type { DeckDetail } from '../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Field, Input } from '../ui/Field';
import { PencilIcon } from '../ui/icons';
import { ErrorMessage } from '../ui/States';
import { panelStyles } from '../ui/styles';

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
            <header className='flex flex-wrap items-start justify-between gap-4'>
                <div className='min-w-0 space-y-2'>
                    <p className='label text-primary'>Deck</p>
                    <h1 className='font-display text-title break-words text-ink'>{deck.name}</h1>
                    {deck.archetype && <Badge tone='secondary'>{deck.archetype}</Badge>}
                </div>
                <Button size='sm' onClick={startEditing}>
                    <PencilIcon className='size-4' />
                    Edit
                </Button>
            </header>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={`${panelStyles} space-y-4 p-panel`}>
            <div className='grid gap-4 sm:grid-cols-2'>
                <Field label='Deck Name'>
                    {(control) => <Input {...control} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoFocus></Input>}
                </Field>
                <Field label='Archetype (Optional)'>
                    {(control) => <Input {...control} value={archetype} onChange={(e) => setArchetype(e.target.value)} maxLength={100}></Input>}
                </Field>
            </div>

            {update.isError && <ErrorMessage>{update.error.message}</ErrorMessage>}

            <div className='flex gap-2'>
                <Button type='submit' variant='primary' disabled={!name.trim() || unchanged} loading={update.isPending}>
                    {update.isPending ? 'Saving...' : 'Save'}
                </Button>
                <Button variant='ghost' onClick={cancel} disabled={update.isPending}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}