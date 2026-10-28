import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { getDeck } from '../api';

export default function DeckPage() {
    const { id } = useParams<{ id: string}>();

    const { data, isPending, isError, error } = useQuery({
        queryKey: ['deck', id],
        queryFn: () => getDeck(id!),
        enabled: !!id,
    });

    return (
        <main className='mx-auto max-w-3xl p-8'>
            <Link to='/decks' className='text-sm text-blue-700 hover:underline'>
                ← All Decks
            </Link>

            {isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {isError && <p className='mt-4 text-red-600'>{error.message}</p>}

            {data && (
                <>
                    <h1 className='mt-2 text-3xl font-bold'>{data.name}</h1>
                    <p className='mt-2 text-gray-600'>
                        Main {data.summary.counts.MAIN} · Extra {data.summary.counts.EXTRA}{' '}
                        · Side {data.summary.counts.SIDE}
                    </p>
                    {data.summary.issues.map((issue) => (
                        <p key={issue} className='mt-1 text-sm text-amber-700'>{issue}</p>
                    ))}
                    <p className='mt-6 text-sm text-gray-500'>
                        Placeholder per il deck builder.
                    </p>
                </>
            )}
        </main>
    );
}