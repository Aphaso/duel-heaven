import { useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { deleteCombo, duplicateCombo, getCombo } from '../api';
import ComboPlayer from '../components/ComboPlayer';
import { useConfirm } from '../confirm/useConfirm';
import { Button } from '../ui/Button';
import { ChevronLeftIcon, CopyIcon, PencilIcon, TrashIcon } from '../ui/icons';
import { Page, PageHeader } from '../ui/PageHeader';
import { ErrorMessage, LoadingState } from '../ui/States';
import { buttonStyles } from '../ui/styles';

export default function ComboPage() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const confirm = useConfirm();

    const combo = useQuery({
        queryKey: ['combo', id],
        queryFn: () => getCombo(id!),
        enabled: !!id,
    });

    const remove = useMutation({
        mutationFn: () => deleteCombo(id!),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['combos'] });
            navigate('/combos');
        }
    });

    const duplicate = useMutation({
        mutationFn: () => duplicateCombo(id!),
        onSuccess: async (copy) => {
            queryClient.setQueryData(['combo', copy.id], copy);
            await queryClient.invalidateQueries({ queryKey: ['combos'] });
            navigate(`/combos/${copy.id}`);
        }
    });

    async function askDelete(name: string) {
        const confirmed = await confirm({
            title: `Delete "${name}"?`,
            message: 'The combo will also disappear from every playlist that contains it.',
            confirmLabel: 'Delete',
            destructive: true,
        });
        if (confirmed) {
            remove.mutate();
        }
    }

    return (
        <Page className='space-y-6'>
            <Link to='/combos' className='focus-ring inline-flex items-center gap-1 rounded-control text-sm text-ink-subtle hover:text-primary'>
                <ChevronLeftIcon className='size-4' />
                All Combos
            </Link>

            {combo.isPending && <LoadingState></LoadingState>}
            {combo.isError && <ErrorMessage>{combo.error.message}</ErrorMessage>}

            {combo.data && (
                <>
                    <PageHeader
                        eyebrow='Combo'
                        title={combo.data.name}
                        description={combo.data.description ?? undefined}
                        actions={
                            <>
                                <Button size='sm' variant='danger-ghost' disabled={remove.isPending} onClick={() => void askDelete(combo.data.name)}>
                                    <TrashIcon className='size-4' />
                                    Delete
                                </Button>
                                <Button size='sm' loading={duplicate.isPending} onClick={() => duplicate.mutate()}>
                                    {!duplicate.isPending && <CopyIcon className='size-4' />}
                                    {duplicate.isPending ? 'Copying...' : 'Duplicate'}
                                </Button>
                                <Link to={`/combos/${combo.data.id}/edit`} className={buttonStyles({ variant: 'primary', size: 'sm' })}>
                                    <PencilIcon className='size-4' />
                                    Edit
                                </Link>
                            </>
                        }
                    ></PageHeader>
                    {remove.isError && <ErrorMessage>{remove.error.message}</ErrorMessage>}
                    {duplicate.isError && <ErrorMessage>{duplicate.error.message}</ErrorMessage>}

                    <ComboPlayer key={combo.data.id} combo={combo.data} />
                </>
            )}
        </Page>
    );
}