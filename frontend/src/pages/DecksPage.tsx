import { useState, type SyntheticEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { createDeck, deleteDeck, listDecks } from '../api';
import { useConfirm } from '../confirm/useConfirm';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Field';
import { DeckIcon } from '../ui/icons';
import { Page, PageHeader } from '../ui/PageHeader';
import { Panel } from '../ui/Panel';
import { EmptyState, ErrorMessage, LoadingState } from '../ui/States';

export default function DecksPage() {
    const queryClient = useQueryClient();
    const [name, setName] = useState('');
    const [archetype, setArchetype] = useState('');
    const confirm = useConfirm();

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

    async function handleDelete(id: string, deckName: string) {
        const confirmed = await confirm({
            title: `Delete Deck "${deckName}"?`,
            message: 'Its Decklist and its Side Patterns will be deleted too.',
            confirmLabel: 'Delete',
            destructive: true,
        });
        if (confirmed) {
            remove.mutate(id);
        }
    }

    return (
        <Page>
            <PageHeader eyebrow='Deckbuilder' title='My Decks' description='Your decklists, Side Patterns and proxies, all in one place.'></PageHeader>

            <Panel title='New Deck'>
                <form onSubmit={handleSubmit} className='flex flex-col gap-3 sm:flex-row'>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='Name of the Deck' aria-label='Name of the Deck' className='sm:flex-[2]'></Input>
                    <Input value={archetype} onChange={(e) => setArchetype(e.target.value)} placeholder='Archetype (optional)' aria-label='Archetype (optional)' className='sm:flex-[1.5]'></Input>
                    <Button type='submit' variant='primary' disabled={!name.trim()} loading={create.isPending}>
                        {create.isPending ? 'Creating...' : 'Create Deck'}
                    </Button>
                </form>
                {create.isError && <ErrorMessage className='mt-3'>{create.error.message}</ErrorMessage>}
            </Panel>

            {decks.isPending && <LoadingState></LoadingState>}
            {decks.isError && <ErrorMessage>{decks.error.message}</ErrorMessage>}
            {remove.isError && <ErrorMessage>{remove.error.message}</ErrorMessage>}

            {decks.data && decks.data.length === 0 && (
                <EmptyState icon={<DeckIcon />} title='No Deck present' description='Give your first Deck a name above to start building it.'></EmptyState>
            )}

            {decks.data && decks.data.length > 0 && (
                <section aria-label='Decks' className='space-y-3'>
                    <p className='label text-ink-subtle'>
                        {decks.data.length} {decks.data.length === 1 ? 'Deck' : 'Decks'}
                    </p>
                    <ul className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
                        {decks.data.map((deck) => (
                            <li key={deck.id} className='group relative flex flex-col rounded-panel border border-line bg-surface-raised shadow-panel transition-colors hover:border-aether-800'>
                                <Link to={`/decks/${deck.id}`} className='focus-ring flex flex-1 items-start gap-4 rounded-panel p-panel'>
                                    <span aria-hidden='true' className='grid aspect-card w-10 shrink-0 place-items-center rounded-card border border-aether-800 bg-gradient-to-br from-aether-950 to-arcane-950 text-primary'>
                                        <DeckIcon className='size-4' />
                                    </span>
                                    <span className='min-w-0 flex-1 space-y-1.5'>
                                        <span className='block truncate font-display text-heading text-ink group-hover:text-primary'>{deck.name}</span>
                                        {deck.archetype ? <Badge tone='secondary'>{deck.archetype}</Badge> : <span className='block text-caption text-ink-faint'>No specified Archetype</span>}
                                    </span>
                                </Link>
                                <div className='flex items-center justify-between gap-2 border-t border-line px-panel py-2'>
                                    <span className='text-caption text-ink-subtle'>
                                        Updated on {new Date(deck.updatedAt).toLocaleDateString('it-IT')}
                                    </span>
                                    <Button size='sm' variant='danger-ghost' onClick={() => void handleDelete(deck.id, deck.name)} disabled={remove.isPending}>
                                        Delete
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </Page>
    );
}