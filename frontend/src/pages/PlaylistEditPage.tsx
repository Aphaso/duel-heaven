import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { createPlaylist, getPlaylist, updatePlaylist } from '../api';
import PlaylistEditor from '../components/PlaylistEditor';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { draftFromPlaylist, emptyPlaylistDraft, toPlaylistPayload, type PlaylistDraft } from '../playlistDraft';
import { ChevronLeftIcon } from '../ui/icons';
import { Page, PageHeader } from '../ui/PageHeader';
import { ErrorMessage, LoadingState } from '../ui/States';

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
            await queryClient.invalidateQueries({ queryKey: ['store'] });
            navigate(`/playlists/${saved.id}`, { replace: true });
        },
    });

    // The only navigation guard of this page (we navigate while the mutation is still "pending")
    useUnsavedChangesGuard(dirty && !save.isPending);

    const playlist = playlistQuery.data;

    return (
        <Page className='space-y-6'>
            <Link to={id ? `/playlists/${id}` : '/playlists'} className='focus-ring inline-flex items-center gap-1 rounded-control text-sm text-ink-subtle hover:text-primary'>
                <ChevronLeftIcon className='size-4' />
                Back
            </Link>

            {id && playlistQuery.isPending && <LoadingState></LoadingState>}
            {id && playlistQuery.isError && <ErrorMessage>{playlistQuery.error.message}</ErrorMessage>}

            {(!id || playlist) && (
                <>
                    <PageHeader eyebrow={playlist ? 'Edit Playlist' : 'Library'} title={playlist ? playlist.name : 'New Playlist'}></PageHeader>
                    <PlaylistEditor
                        initial={playlist ? draftFromPlaylist(playlist) : emptyPlaylistDraft()}
                        buyers={playlist?._count.purchases ?? 0}
                        saving={save.isPending}
                        error={save.isError ? save.error.message : null}
                        onSave={(draft) => save.mutate(draft)}
                        onDirtyChange={setDirty}
                    >
                    </PlaylistEditor>
                </>
            )}
        </Page>
    );
}