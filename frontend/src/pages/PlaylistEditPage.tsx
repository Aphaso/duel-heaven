import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { createPlaylist, getPlaylist, updatePlaylist } from '../api';
import PlaylistEditor from '../components/PlaylistEditor';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { draftFromPlaylist, emptyPlaylistDraft, toPlaylistPayload, type PlaylistDraft } from '../playlistDraft';

export default function PlaylistEditPage() {
    const { id } = useParams<{ id: string }>();
    return <PlaylistEditScreen key={id ?? 'new'} id={id} />;
}

function PlaylistEditScreen({ id }: { id: string | undefined }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [dirty, setDirty] = useState(false);

    const playlistQuery = useQuery({
        queryKey: ['playlist', id],
        queryFn: () => getPlaylist(id!),
        enabled: !!id,
    });

    const save = useMutation({
        mutationFn: (draft: PlaylistDraft) => {
            const payload = toPlaylistPayload(draft);
            return id ? updatePlaylist(id, payload) : createPlaylist(payload);
        },
        onSuccess: async (saved) => {
            queryClient.setQueryData(['playlist', saved.id], saved);
            await queryClient.invalidateQueries({ queryKey: ['playlists'] });
            navigate(`/playlists/${saved.id}`, { replace: true });
        },
    });

    // The only navigation guard of this page (we navigate while the mutation is still "pending")
    useUnsavedChangesGuard(dirty && !save.isPending);

    const playlist = playlistQuery.data;

    return (
        <main className='mx-auto max-w-5xl p-8'>
            <Link to={id ? `/playlists/${id}` : '/playlists'} className='text-sm text-blue-700 hover:underline'>
                ← Back
            </Link>

            {id && playlistQuery.isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {id && playlistQuery.isError && <p className='mt-4 text-red-600'>{playlistQuery.error.message}</p>}

            {(!id || playlist) && (
                <>
                    <h1 className='mt-2 text-2xl font-bold'>
                        {playlist ? `Edit: ${playlist.name}` : 'New Playlist'}
                    </h1>
                    <div className='mt-4'>
                        <PlaylistEditor
                            initial={playlist ? draftFromPlaylist(playlist) : emptyPlaylistDraft()}
                            saving={save.isPending}
                            error={save.isError ? save.error.message : null}
                            onSave={(draft) => save.mutate(draft)}
                            onDirtyChange={setDirty}
                        >
                        </PlaylistEditor>
                    </div>
                </>
            )}
        </main>
    );
}