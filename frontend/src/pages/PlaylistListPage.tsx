import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { listPlaylists, reorderPlaylists } from '../api';
import SortableRow from '../components/SortableRow';
import { sortByIds } from '../playlistOrder';
import { formatPrice } from '../price';
import type { PlaylistSummary } from '../types';
import PlaylistCover from '../components/PlaylistCover';
import { Badge } from '../ui/Badge';
import { PlaylistIcon, PlusIcon } from '../ui/icons';
import { Page, PageHeader } from '../ui/PageHeader';
import { EmptyState, ErrorMessage, LoadingState } from '../ui/States';
import { buttonStyles } from '../ui/styles';

export default function PlaylistListPage() {
    const queryClient = useQueryClient();
    const playlists = useQuery({ queryKey: ['playlists'], queryFn: listPlaylists });

    // The list changes on screen right away; if saving fails it goes back
    const reorder = useMutation({
        mutationFn: reorderPlaylists,
        onMutate: async (ids: string[]) => {
            await queryClient.cancelQueries({ queryKey: ['playlists'] });
            const previous = queryClient.getQueryData<PlaylistSummary[]>(['playlists']);
            queryClient.setQueryData<PlaylistSummary[]>(['playlists'], (old) => old && sortByIds(old, ids));
            return { previous };
        },
        onError: (_error, _ids, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['playlists'], context.previous);
            }
        },
        // Success or not, the server has the last word
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['playlists'] }),
    });

    const sensors = useSensors(
        // Start dragging after 6 pixels of movement
        useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    function handleDragEnd({ active, over }: DragEndEvent) {
        const items = playlists.data;
        if (!items || !over || active.id === over.id) {
            return;
        }
        const from = items.findIndex((p) => p.id === active.id);
        const to = items.findIndex((p) => p.id === over.id);
        if (from === -1 || to === -1) {
            return;
        }
        reorder.mutate(arrayMove(items, from, to).map((p) => p.id));
    }

    return (
        <Page>
            <PageHeader
                eyebrow='Library'
                title='Playlists'
                description='Collect your combos in a set order. Drag them to reorder the list, or put them on sale in the Store.'
                actions={
                    <Link to='/playlists/new' className={buttonStyles({ variant: 'primary' })}>
                        <PlusIcon className='size-4' />
                        New Playlist
                    </Link>
                }
            ></PageHeader>

            {playlists.isPending && <LoadingState></LoadingState>}
            {playlists.isError && <ErrorMessage>{playlists.error.message}</ErrorMessage>}
            {reorder.isError && <ErrorMessage>{reorder.error.message}</ErrorMessage>}
            {playlists.data?.length === 0 && (
                <EmptyState
                    icon={<PlaylistIcon />}
                    title='No Playlists yet.'
                    description='Group your combos into a playlist to study them in order, or to sell them.'
                    action={<Link to='/playlists/new' className={buttonStyles({ variant: 'primary' })}><PlusIcon className='size-4' />New Playlist</Link>}
                ></EmptyState>
            )}

            {playlists.data && playlists.data.length > 0 && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext
                        items={playlists.data.map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <ul className='space-y-2'>
                            {playlists.data.map((p) => (
                                <SortableRow key={p.id} id={p.id} name={p.name} disabled={reorder.isPending}>
                                    <Link
                                        to={`/playlists/${p.id}`}
                                        className='focus-ring group flex min-w-0 flex-1 items-center gap-4 rounded-control p-1'
                                    >
                                        <PlaylistCover seed={p.id} className='size-14 shrink-0' />
                                        <span className='min-w-0 flex-1 space-y-1'>
                                            <span className='block truncate font-display text-base font-semibold text-ink group-hover:text-primary'>{p.name}</span>
                                            {p.description && <span className='block truncate text-sm text-ink-subtle'>{p.description}</span>}
                                            <span className='flex flex-wrap items-center gap-2'>
                                                <Badge>
                                                    {p._count.combos} combo{p._count.combos === 1 ? '' : 's'}
                                                </Badge>
                                                {p.isForSale && p.priceCents !== null && (
                                                    <Badge tone='accent'>For sale · {formatPrice(p.priceCents)}</Badge>
                                                )}
                                                {p._count.purchases > 0 && (
                                                    <span className='numeric text-caption text-success'>{p._count.purchases} sold</span>
                                                )}
                                            </span>
                                        </span>
                                    </Link>
                                </SortableRow>
                            ))}
                        </ul>
                    </SortableContext>
                </DndContext>
            )}
        </Page>
    );
}