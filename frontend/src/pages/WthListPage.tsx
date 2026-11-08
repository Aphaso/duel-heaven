import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { listWthGuides } from '../api';

export default function WthListPage() {
    const guides = useQuery({ queryKey: ['wth-list'], queryFn: listWthGuides });

    return (
        <main className='mx-auto max-w-4xl p-8'>
            <div className='flex items-center justify-between'>
                <h1 className='text-2xl font-bold'>Where to Handtrap?</h1>
                <Link to='/wth/new' className='rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'>
                    New Guide
                </Link>
            </div>

            {guides.isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {guides.isError && <p className='mt-4 text-red-600'>{guides.error.message}</p>}
            {guides.data?.length === 0 && (
                <p className='mt-4 text-gray-500'>No Guides yet: create one for the first Deck you fear.</p>
            )}

            <ul className='mt-4 space-y-2'>
                {guides.data?.map((g) => (
                    <li key={g.id}>
                        <Link to={`/wth/${g.id}`} className='block rounded border p-3 hover:bg-gray-50'>
                            <span className='font-semibold'>{g.opponentDeckName}</span>
                            <span className='ml-2 text-sm text-gray-500'>
                                {g._count.entries} Opponent Card{g._count.entries === 1 ? '' : 's'}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </main>
    );
}