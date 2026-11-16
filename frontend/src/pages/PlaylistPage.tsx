import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { deletePlaylist, getCombo, getPlaylist } from '../api';
import { formatPrice } from '../price';
import ComboPlayer from '../components/ComboPlayer';

export default function PlaylistPage() {
    const { id } = useParams<{ id: string }>();
    return <PlaylistScreen key={id} id={id} />;
}

function PlaylistScreen({ id }: { id: string | undefined }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [index, setIndex] = useState(0);

    const playlist = useQuery({
        queryKey: ['playlist', id],
        queryFn: () => getPlaylist(id!),
        enabled: !!id,
    });

    // Derived: the combo that is playing (the index can never point outside the list)
    const rows = playlist.data?.combos ?? [];
    const current = rows[Math.min(index, rows.length - 1)];
    const currentIndex = current ? rows.indexOf(current) : -1;

    // Only the combo that is playing is downloaded
    const combo = useQuery({
        queryKey: ['combo', current?.comboId],
        queryFn: () => getCombo(current!.comboId),
        enabled: !!current,
    });

    const remove = useMutation({
        mutationFn: () => deletePlaylist(id!),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['playlists'] });
            await queryClient.invalidateQueries({ queryKey: ['store'] });
            navigate('/playlists');
        },
    });

    return (
        <main className='mx-auto max-w-6xl p-8'>
            <Link to='/playlists' className='text-sm text-blue-700 hover:underline'>
                ← All Playlists
            </Link>

            {playlist.isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {playlist.isError && <p className='mt-4 text-red-600'>{playlist.error.message}</p>}

            {playlist.data && (
                <>
                    <div className='mt-2 flex items-start justify-between gap-4'>
                        <div>
                            <h1 className='text-2xl font-bold'>{playlist.data.name}</h1>
                            {playlist.data.description && (
                                <p className='mt-1 text-gray-700'>{playlist.data.description}</p>
                            )}
                            {playlist.data.isForSale && playlist.data.priceCents !== null && (
                                <p className='mt-1 text-sm text-green-800'>
                                    For sale at {formatPrice(playlist.data.priceCents)}
                                    {playlist.data._count.purchases > 0 && ` · ${playlist.data._count.purchases} sold`}
                                </p>
                            )}
                        </div>
                        <div className='flex gap-2'>
                            <Link to={`/playlists/${playlist.data.id}/edit`} className='rounded border px-3 py-1'>
                                Edit
                            </Link>
                            <button
                                type='button'
                                disabled={remove.isPending}
                                onClick={() => {
                                    const buyers = playlist.data._count.purchases;
                                    const message =
                                        buyers > 0
                                            ? `"${playlist.data.name}" has been bought by ${buyers} ${buyers === 1 ? 'person' : 'people'}. If you delete it, they keep a frozen copy of its last version, but it disappears for you and from the Store. Its Combos are kept. Delete anyway?`
                                            : `Delete the Playlist "${playlist.data.name}"? Its Combos are kept.`;
                                    if (window.confirm(message)) {
                                        remove.mutate();
                                    }
                                }}
                                className='rounded border border-red-600 px-3 py-1 text-red-700 disabled:opacity-40'
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                    {remove.isError && <p className='mt-2 text-red-600'>{remove.error.message}</p>}

                    {rows.length === 0 ? (
                        <p className='mt-6 text-gray-500'>This Playlist is empty: use Edit to add Combos.</p>
                    ) : (
                        <div className='mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]'>
                            <ol className='space-y-1 text-sm'>
                                {rows.map((row, i) => (
                                    <li key={row.id}>
                                        <button
                                            type='button'
                                            onClick={() => setIndex(i)}
                                            className={`w-full rounded px-2 py-1 text-left ${
                                                i === currentIndex ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-100'
                                            }`}
                                        >
                                            {i + 1}. {row.combo.name}
                                        </button>
                                    </li>
                                ))}
                            </ol>

                            <div className='space-y-4'>
                                <div className='flex items-center justify-between gap-2'>
                                    <h2 className='text-xl font-semibold'>
                                        {current?.combo.name}
                                        <span className='ml-2 text-sm font-normal text-gray-500'>
                                            Combo {currentIndex + 1} / {rows.length}
                                        </span>
                                    </h2>
                                    <div className='flex gap-2'>
                                        <button
                                            type='button'
                                            disabled={currentIndex <= 0}
                                            onClick={() => setIndex(currentIndex - 1)}
                                            className='rounded border px-3 py-1 disabled:opacity-40'
                                        >
                                            ◀ Previous Combo
                                        </button>
                                        <button
                                            type='button'
                                            disabled={currentIndex >= rows.length - 1}
                                            onClick={() => setIndex(currentIndex + 1)}
                                            className='rounded border px-3 py-1 disabled:opacity-40'
                                        >
                                            Next Combo ▶
                                        </button>
                                    </div>
                                </div>

                                {combo.isPending && <p className='text-gray-500'>Loading...</p>}
                                {combo.isError && <p className='text-red-600'>{combo.error.message}</p>}
                                {combo.data && <ComboPlayer key={combo.data.id} combo={combo.data}></ComboPlayer>}
                            </div>
                        </div>
                    )}
                </>
            )}
        </main>
    );
}