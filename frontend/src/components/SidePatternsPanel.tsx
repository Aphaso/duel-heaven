import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSidePattern, deleteSidePattern, listSidePatterns, updateSidePattern } from '../api';
import SidePatternEditor from './SidePatternEditor';
import SidePatternView from './SidePatternView';
import { draftFromPattern, emptyDraft, toPayload, type PatternDraft } from '../sidePatternDraft';
import type { DeckDetail } from '../types';
import { useConfirm } from '../confirm/useConfirm';

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
        return <p>Loading...</p>;
    }
    if (error) {
        return <p className='text-red-700'>{error.message}</p>;
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
        <div className='space-y-3'>
            <div className='flex flex-wrap items-center gap-2'>
                {patterns.map((p) => (
                    <button
                        key={p.id}
                        type='button'
                        onClick={() => setMode({ kind: 'view', id: p.id })}
                        className={`rounded border px-2 py-1 text-sm ${
                            p.id === selected?.id ? 'bg-blue-600 text-white' : ''
                        }`}
                    >
                        {p.opponentDeckName}
                        {p.issues.length > 0 ? ' ⚠' : ''}
                    </button>
                ))}
                <button
                    type='button'
                    onClick={() => setMode({ kind: 'edit', id: null })}
                    className='rounded border border-dashed px-2 py-1 text-sm'
                >
                    + New Pattern
                </button>
            </div>

            {selected ? (
                <>
                    <SidePatternView pattern={selected} />
                    <div className='flex gap-2'>
                        <button
                            type='button'
                            onClick={() => setMode({ kind: 'edit', id: selected.id })}
                            className='rounded border px-3 py-1'
                        >
                            Edit
                        </button>
                        <button
                            type='button'
                            disabled={remove.isPending}
                            onClick={() => void askDelete(selected.id, selected.opponentDeckName)}
                            className='rounded border border-red-600 px-3 py-1 text-red-700 disabled:opacity-40'
                        >
                            Delete
                        </button>
                    </div>
                </>
            ) : (
                <p className='text-sm text-gray-500'>No Side Patterns yet.</p>
            )}
        </div>
    );
}