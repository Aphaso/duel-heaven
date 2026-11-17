import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { listPlaylists, reorderPlaylists } from '../api';
import SortableRow from '../components/SortableRow';
import { sortByIds } from '../playlistOrder';
import { formatPrice } from '../price';
import type { PlaylistSummary } from '../types';

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
        <main className='mx-auto max-w-4xl p-8'>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-bold'>Playlists</h1>
                <Link to='/playlists/new' className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'>
                    New Playlist
                </Link>
            </div>

            {playlists.isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {playlists.isError && <p className='mt-4 text-red-600'>{playlists.error.message}</p>}
            {playlists.data?.length === 0 && <p className='mt-4 text-gray-500'>No Playlists yet.</p>}
            {reorder.isError && <p className='mt-4 text-red-600'>{reorder.error.message}</p>}

            {playlists.data && playlists.data.length > 0 && (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext
                        items={playlists.data.map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <ul className='mt-4 space-y-2'>
                            {playlists.data.map((p) => (
                                <SortableRow key={p.id} id={p.id} name={p.name} disabled={reorder.isPending}>
                                    <Link
                                        to={`/playlists/${p.id}`}
                                        className='block flex-1 rounded p-1 hover:bg-gray-50'
                                    >
                                        <span className='font-semibold'>{p.name}</span>
                                        <span className='ml-2 text-sm text-gray-500'>
                                            {p._count.combos} combo{p._count.combos === 1 ? '' : 's'}
                                        </span>
                                        {p.isForSale && p.priceCents !== null && (
                                            <span className='ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-800'>
                                                For sale · {formatPrice(p.priceCents)}
                                            </span>
                                        )}
                                        {p._count.purchases > 0 && (
                                            <span className='ml-2 text-xs text-gray-500'>{p._count.purchases} sold</span>
                                        )}
                                        {p.description && <p className='text-sm text-gray-600'>{p.description}</p>}
                                    </Link>
                                </SortableRow>
                            ))}
                        </ul>
                    </SortableContext>
                </DndContext>
            )}
        </main>
    );
}