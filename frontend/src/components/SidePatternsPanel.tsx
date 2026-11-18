import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSidePattern, deleteSidePattern, listSidePatterns, updateSidePattern } from '../api';
import SidePatternEditor from './SidePatternEditor';
import SidePatternView from './SidePatternView';
import { draftFromPattern, emptyDraft, toPayload, type PatternDraft } from '../sidePatternDraft';
import type { DeckDetail } from '../types';
import { useConfirm } from '../confirm/useConfirm';
import { Button } from '../ui/Button';
import { AlertIcon, PencilIcon, PlusIcon, SwapIcon } from '../ui/icons';
import { Panel } from '../ui/Panel';
import { EmptyState, ErrorMessage, LoadingState } from '../ui/States';
import { cn } from '../ui/styles';

interface Props {
    deck: DeckDetail
    decklistDirty: boolean;
    onDirtyChange: (dirty: boolean) => void;
}

// 'edit' with id null = creating a new pattern
type Mode = { kind: 'view'; id: string | null } | { kind: 'edit'; id: string | null };

export default function SidePatternsPanel({
    deck,
    decklistDirty,
    onDirtyChange,
}: Props) {
    const deckId = deck.id;
    const deckCards = deck.cards;
    const queryClient = useQueryClient();
    const [mode, setMode] = useState<Mode>({ kind: 'view', id: null });
    const confirm = useConfirm();

    const { data: patterns = [], isLoading, error } = useQuery({
        queryKey: ['side-patterns', deckId],
        queryFn: () => listSidePatterns(deckId),
    });

    const save = useMutation({
        mutationFn: ({ id, draft }: { id: string | null; draft: PatternDraft }) => {
            const payload = toPayload(draft, deckCards);
            return id
                ? updateSidePattern(deckId, id, payload)
                : createSidePattern(deckId, payload);
        },
        onSuccess: async (saved) => {
            // Wait for the fresh list before going back to the view,
            // otherwise the view would flash the old data.
            await queryClient.invalidateQueries({ queryKey: ['side-patterns', deckId] });
            setMode({ kind: 'view', id: saved.id });
        },
    });

    const remove = useMutation({
        mutationFn: (id: string) => deleteSidePattern(deckId, id),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['side-patterns', deckId] });
            setMode({ kind: 'view', id: null });
        },
    });

    async function askDelete(patternId: string, name: string) {
        const confirmed = await confirm({
            title: `Delete "${name}"?`,
            message: 'This Side Pattern will be deleted.',
            confirmLabel: 'Delete',
            destructive: true,
        });
        if (confirmed) {
            remove.mutate(patternId);
        }
    }

    if (isLoading) {
        return <LoadingState></LoadingState>;
    }
    if (error) {
        return <ErrorMessage>{error.message}</ErrorMessage>;
    }

    if (mode.kind === 'edit') {
        const editing = patterns.find((p) => p.id === mode.id);
        return (
            <SidePatternEditor
                key={mode.id ?? 'new'}
                initial={editing ? draftFromPattern(editing) : emptyDraft()}
                deckCards={deckCards}
                decklistDirty={decklistDirty}
                saving={save.isPending}
                error={save.error ? save.error.message : null}
                onSave={(draft) => save.mutate({ id: mode.id, draft })}
                onCancel={() => {
                    save.reset();
                    setMode({ kind: 'view', id: mode.id });
                }}
                onDirtyChange={onDirtyChange}
            />
        );
    }

    // Derived: the selected pattern, or the first one if the selection is gone
    const selected = patterns.find((p) => p.id === mode.id) ?? patterns[0] ?? null;

    return (
        <div className='space-y-5'>
            <div className='flex flex-wrap items-center gap-2'>
                <span className='label mr-1 text-ink-subtle'>Vs</span>
                {patterns.map((p) => {
                    const active = p.id === selected?.id;
                    return (
                        <button
                            key={p.id}
                            type='button'
                            onClick={() => setMode({ kind: 'view', id: p.id })}
                            aria-pressed={active}
                            className={cn(
                                'focus-ring inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors',
                                active
                                    ? 'border-primary bg-aether-950 text-ink shadow-glow-primary'
                                    : 'border-line-strong bg-surface-raised text-ink-muted hover:border-night-500 hover:text-ink',
                            )}
                        >
                            {p.opponentDeckName}
                            {p.issues.length > 0 && <AlertIcon aria-label='Needs attention' className='size-3.5 text-warning' />}
                        </button>
                    );
                })}
                <Button size='sm' variant='ghost' onClick={() => setMode({ kind: 'edit', id: null })} className='rounded-full border border-dashed border-line-strong'>
                    <PlusIcon className='size-4' />
                    New Pattern
                </Button>
            </div>

            {selected ? (
                <Panel
                    title={<>Vs <span className='text-ink'>{selected.opponentDeckName}</span></>}
                    actions={
                        <>
                            <Button size='sm' onClick={() => setMode({ kind: 'edit', id: selected.id })}>
                                <PencilIcon className='size-4' />
                                Edit
                            </Button>
                            <Button size='sm' variant='danger' disabled={remove.isPending} onClick={() => void askDelete(selected.id, selected.opponentDeckName)}>
                                Delete
                            </Button>
                        </>
                    }
                >
                    <SidePatternView pattern={selected} />
                </Panel>
            ) : (
                <EmptyState
                    icon={<SwapIcon />}
                    title='No Side Patterns yet.'
                    description='Plan which cards go out and which come in from the Side Deck against a specific opponent.'
                    action={<Button variant='primary' onClick={() => setMode({ kind: 'edit', id: null })}><PlusIcon className='size-4' />New Pattern</Button>}
                ></EmptyState>
            )}
        </div>
    );
}