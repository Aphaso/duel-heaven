import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router';
import { getDeck } from '../api';
import DeckEditor from '../components/DeckEditor';

export default function DeckPage() {
    const { id } = useParams<{ id: string }>();

    const deck = useQuery({
        queryKey: ['deck', id],
        queryFn: () => getDeck(id!),
        enabled: !!id,
    });

    return (
        <main className='mx-auto max-w-7xl p-8'>
            <Link to='/decks' className='text-sm text-blue-700 hover:underline'>
                ← All Decks
            </Link>

            {deck.isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {deck.isError && <p className='mt-4 text-red-600'>{deck.error.message}</p>}

            {deck.data && <DeckEditor key={deck.data.id} deck={deck.data}></DeckEditor>}
        </main>
    );
}