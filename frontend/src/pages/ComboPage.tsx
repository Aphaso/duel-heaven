import { useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router';
import { deleteCombo, getCombo } from '../api';
import ComboPlayer from '../components/ComboPlayer';

export default function ComboPage() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

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
                        <button
                            type='button'
                            disabled={remove.isPending}
                            onClick={() => {
                                if (window.confirm(`Delete "${combo.data.name}"?`)) {
                                    remove.mutate();
                                }
                            }}
                            className='rounded border border-red-600 px-3 py-1 text-red-700 disabled:opacity-40'
                        >
                            Delete
                        </button>
                    </div>
                    {remove.isError && <p className='mt-2 text-red-600'>{remove.error.message}</p>}

                    <div className='mt-6'>
                        <ComboPlayer key={combo.data.id} combo={combo.data} />
                    </div>
                </>
            )}
        </main>
    );
}