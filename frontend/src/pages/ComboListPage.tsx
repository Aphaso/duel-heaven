import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { listCombos } from '../api';

export default function ComboListPage() {
    const combos = useQuery({ queryKey: ['combos'], queryFn: listCombos });

    return (
        <main className='mx-auto max-w-4xl p-8'>
            <h1 className='text-2xl font-bold'>Combos</h1>

            {combos.isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {combos.isError && <p className='mt-4 text-red-600'>{combos.error.message}</p>}
            {combos.data?.length === 0 && <p className='mt-4 text-gray-500'>No Combos yet.</p>}

            <ul className='mt-4 space-y-2'>
                {combos.data?.map((c) => (
                    <li key={c.id}>
                        <Link to={`/combos/${c.id}`} className='block rounded border p-3 hover:bg-gray-50'>
                            <span className='font-semibold'>{c.name}</span>
                            <span className='ml-2 text-sm text-gray-500'>
                                {c.stepCount} step{c.stepCount === 1 ? '' : 's'}
                            </span>
                            {c.description && <p className='text-sm text-gray-600'>{c.description}</p>}
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}