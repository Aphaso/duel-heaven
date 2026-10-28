import { useState } from 'react';
import { cardImageUrl } from '../api';
import type { Card } from '../types';

export default function CardTile({ card }: { card: Card }) {
    const [failed, setFailed] = useState(false);

    return (
        <div title={card.name} className='aspect-[59/86] overflow-hidden rounded bg-gray-100 shadow'>
            {failed ? (
                <div className='flex h-full items-center justify-center p-2 text-center text-sm text-gray-600'>
                    {card.name}
                </div>
            ) : (
                <img src={cardImageUrl(card.id)} alt={card.name} loading='lazy' onError={() => setFailed(true)} className='h-full w-full object-cover'></img>
            )}
        </div>
    );
}