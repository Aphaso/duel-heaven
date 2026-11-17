import { useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { deleteCombo, duplicateCombo, getCombo } from '../api';
import ComboPlayer from '../components/ComboPlayer';
import { useConfirm } from '../confirm/useConfirm';

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
        <main className='mx-auto max-w-6xl p-8'>
            <Link to='/combos' className='text-sm text-blue-700 hover:underline'>
                ← All Combos
            </Link>

            {combo.isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {combo.isError && <p className='mt-4 text-red-600'>{combo.error.message}</p>}

            {combo.data && (
                <>
                    <div className='mt-2 flex items-start justify-between gap-4'>
                        <div>
                            <h1 className='text-2xl font-bold'>{combo.data.name}</h1>
                            {combo.data.description && (
                                <p className='mt-1 text-gray-700'>{combo.data.description}</p>
                            )}
                        </div>
                        <div className='flex gap-2'>
                            <button
                                type='button'
                                disabled={remove.isPending}
                                onClick={() => void askDelete(combo.data.name)}
                                className='rounded border border-red-600 px-3 py-1 text-red-700 disabled:opacity-40'
                            >
                                Delete
                            </button>
                            <button
                                type='button'
                                disabled={duplicate.isPending}
                                onClick={() => duplicate.mutate()}
                                className='rounded border px-3 py-1 disabled:opacity-40'
                            >
                                {duplicate.isPending ? 'Copying...' : 'Duplicate'}
                            </button>
                            <Link to={`/combos/${combo.data.id}/edit`} className='rounded border px-3 py-1'>
                                Edit
                            </Link>
                        </div>
                    </div>
                    {remove.isError && <p className='mt-2 text-red-600'>{remove.error.message}</p>}
                    {duplicate.isError && <p className='mt-2 text-red-600'>{duplicate.error.message}</p>}

                    <div className='mt-6'>
                        <ComboPlayer key={combo.data.id} combo={combo.data} />
                    </div>
                </>
            )}
        </main>
    );
}