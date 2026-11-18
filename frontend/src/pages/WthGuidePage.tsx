import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { createWthGuide, deleteWthGuide, getWthGuide, updateWthGuide } from '../api';
import WthGuideEditor from '../components/WthGuideEditor';
import WthGuideView from '../components/WthGuideView';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';
import { draftFromGuide, emptyWthDraft, toWthPayload, type WthDraft } from '../wthDraft';
import { useConfirm } from '../confirm/useConfirm';
import { Button } from '../ui/Button';
import { ChevronLeftIcon, PencilIcon, TrashIcon } from '../ui/icons';
import { Page, PageHeader } from '../ui/PageHeader';
import { ErrorMessage, LoadingState } from '../ui/States';

export default function WthGuidePage() {
    const { id } = useParams<{ id: string }>();
    return <WthGuideScreen key={id ?? 'new'} id={id} />;
}

function WthGuideScreen({ id }: { id: string | undefined }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const confirm = useConfirm();
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

    async function askDelete(name: string) {
        const confirmed = await confirm({
            title: `Delete "${name}"?`,
            message: 'The guide will be deleted.',
            confirmLabel: 'Delete',
            destructive: true,
        });
        if (confirmed) {
            remove.mutate();
        }
    }

    // The only navigation guard of this page. While saving there is nothing to protect:
    // after a creation we navigate while the mutation is still "pending".
    useUnsavedChangesGuard(dirty && !save.isPending);

    const guide = guideQuery.data;
    const isEditing = !id || editing;

    return (
        <Page className='space-y-6'>
            <Link to='/wth' className='focus-ring inline-flex items-center gap-1 rounded-control text-sm text-ink-subtle hover:text-primary'>
                <ChevronLeftIcon className='size-4' />
                All Guides
            </Link>

            {id && guideQuery.isPending && <LoadingState></LoadingState>}
            {id && guideQuery.isError && <ErrorMessage>{guideQuery.error.message}</ErrorMessage>}

            {(!id || guide) && (
                <>
                    <PageHeader
                        eyebrow={guide ? (isEditing ? 'Edit Guide' : 'Where to Handtrap vs') : 'Where to Handtrap?'}
                        title={guide ? guide.opponentDeckName : 'New Guide'}
                        actions={
                            guide && !isEditing && (
                                <>
                                    <Button size='sm' variant='danger-ghost' disabled={remove.isPending} onClick={() => void askDelete(guide.opponentDeckName)}>
                                        <TrashIcon className='size-4' />
                                        Delete
                                    </Button>
                                    <Button size='sm' variant='primary' onClick={() => setEditing(true)}>
                                        <PencilIcon className='size-4' />
                                        Edit
                                    </Button>
                                </>
                            )
                        }
                    ></PageHeader>
                    {remove.isError && <ErrorMessage>{remove.error.message}</ErrorMessage>}

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
                </>
            )}
        </Page>
    );
}