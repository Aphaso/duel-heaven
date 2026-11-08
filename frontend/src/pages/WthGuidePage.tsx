import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { createWthGuide, deleteWthGuide, getWthGuide, updateWthGuide } from '../api';
import WthGuideEditor from '../components/WthGuideEditor';
import WthGuideView from '../components/WthGuideView';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { draftFromGuide, emptyWthDraft, toWthPayload, type WthDraft } from '../wthDraft';

export default function WthGuidePage() {
    const { id } = useParams<{ id: string }>();
    return <WthGuideScreen key={id ?? 'new'} id={id} />;
}

function WthGuideScreen({ id }: { id: string | undefined }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [dirty, setDirty] = useState(false);

    const guideQuery = useQuery({
        queryKey: ['wth', id],
        queryFn: () => getWthGuide(id!),
        enabled: !!id,
    });

    const save = useMutation({
        mutationFn: (draft: WthDraft) => {
            const payload = toWthPayload(draft);
            return id ? updateWthGuide(id, payload) : createWthGuide(payload);
        },
        onSuccess: async (saved) => {
            queryClient.setQueryData(['wth', saved.id], saved);
            await queryClient.invalidateQueries({ queryKey: ['wth-list'] });
            if (id) {
                setEditing(false);
            } else {
                navigate(`/wth/${saved.id}`, { replace: true });
            }
        },
    });

    const remove = useMutation({
        mutationFn: () => deleteWthGuide(id!),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['wth-list'] });
            navigate('/wth');
        },
    });

    // The only navigation guard of this page. While saving there is nothing to protect:
    // after a creation we navigate while the mutation is still "pending".
    useUnsavedChangesGuard(dirty && !save.isPending);

    const guide = guideQuery.data;
    const isEditing = !id || editing;

    return (
        <main className='mx-auto max-w-5xl p-8'>
            <Link to='/wth' className='text-sm text-blue-700 hover:underline'>
                ← All guides
            </Link>

            {id && guideQuery.isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {id && guideQuery.isError && <p className='mt-4 text-red-600'>{guideQuery.error.message}</p>}

            {(!id || guide) && (
                <>
                    <div className='mt-2 flex items-center justify-between'>
                        <h1 className='text-2xl font-bold'>
                            {guide ? guide.opponentDeckName : 'New Guide'}
                        </h1>
                        {guide && !isEditing && (
                            <div className='flex gap-2'>
                                <button
                                    type='button'
                                    onClick={() => setEditing(true)}
                                    className='rounded border px-3 py-1'
                                >
                                    Edit
                                </button>
                                <button
                                    type='button'
                                    disabled={remove.isPending}
                                    onClick={() => {
                                        if (window.confirm(`Delete "${guide.opponentDeckName}"?`)) {
                                            remove.mutate();
                                        }
                                    }}
                                    className='rounded border border-red-600 px-3 py-1 text-red-700 disabled:opacity-40'
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                    {remove.isError && <p className='mt-2 text-red-600'>{remove.error.message}</p>}

                    <div className='mt-4'>
                        {isEditing ? (
                            <WthGuideEditor
                                initial={guide ? draftFromGuide(guide) : emptyWthDraft()}
                                saving={save.isPending}
                                error={save.isError ? save.error.message : null}
                                onSave={(draft) => save.mutate(draft)}
                                onCancel={
                                    guide
                                        ? () => {
                                              save.reset();
                                              setEditing(false);
                                          }
                                        : undefined
                                }
                                onDirtyChange={setDirty}
                            />
                        ) : (
                            guide && <WthGuideView guide={guide} />
                        )}
                    </div>
                </>
            )}
        </main>
    );
}