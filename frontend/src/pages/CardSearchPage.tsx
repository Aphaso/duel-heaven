import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { searchCards } from '../api';
import { useDebounce } from '../hooks/useDebounce';

export default function CardSearchPage() {
    const [text, setText] = useState('');
    const search = useDebounce(text.trim(), 300);

    const { data, isPending, isError, error } = useQuery({
        queryKey: ['cards', search],
        queryFn: () => searchCards({ search, page: 1, limit: 20}),
        placeholderData: keepPreviousData,
    });

    return (
        <main className='mx-auto max-w-3xl p-8'>
            <h1 className='text-3xl font-bold'>Search cards</h1>

            <input 
                type="search"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='Card name...'
                className='mt-4 w-full rounde border border-gray-300 px-3 py-2'>
            </input>

            {isPending && <p className='mt-4 text-gray-500'>Loading...</p>}
            {isError && <p className='mt-4 text-red-600'>{error.message}</p>}

            {data && (
                <>
                    <p className='mt-4 text-sm text-gray-500'>
                        {data.total} found cards
                    </p>
                    <ul className='mt-2 divide-y'>
                        {data.items.map((card) => (
                            <li key={card.id} className='py-2'>
                                <span className='font-medium'>{card.name}</span>
                                <span className='ml-2 text-sm text-gray-500'>{card.type}</span>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </main>
    );
}