import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { duplicateCombo, listCombos } from '../api';

export default function ComboListPage() {
    const combos = useQuery({ queryKey: ['combos'], queryFn: listCombos });
    const queryClient = useQueryClient();
    const duplicate = useMutation({
        mutationFn: duplicateCombo,
        // The copy appears at the top of the list
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['combos'] }),
    });

    return (
        <main className='mx-auto max-w-4xl p-8'>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-bold'>Combos</h1>
                <Link to='/combos/new' className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'>
                    New Combo
                </Link>
            </div>

            {combos.isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {combos.isError && <p className='mt-4 text-red-600'>{combos.error.message}</p>}
            {combos.data?.length === 0 && <p className='mt-4 text-gray-500'>No Combos yet.</p>}
            {duplicate.isError && <p className='mt-4 text-red-600'>{duplicate.error.message}</p>}

            <ul>
                {combos.data?.map((c) => (
                    <li key={c.id} className='flex items-stretch gap-2'>
                        <Link to={`/combos/${c.id}`} className='block flex-1 rounded border p-3 hover:bg-gray-50'>
                            <span className='font-semibold'>{c.name}</span>
                            <span className='ml-2 text-sm text-gray-500'>
                                {c.stepCount} step{c.stepCount === 1 ? '' : 's'}
                            </span>
                            {c.description && <p className='text-sm text-gray-600'>{c.description}</p>}
                        </Link>
                        <button
                            type='button'
                            disabled={duplicate.isPending}
                            onClick={() => duplicate.mutate(c.id)}
                            className='rounded border px-3 text-sm hover:bg-gray-50 disabled:opacity-40'
                        >
                            {duplicate.isPending && duplicate.variables === c.id ? 'Copying...' : 'Duplicate'}
                        </button>
                    </li>
                ))}
            </ul>
        </main>
    );
}