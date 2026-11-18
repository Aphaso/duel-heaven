import { useState } from 'react';
import { cardImageUrl } from '../api';
import type { Card } from '../types';
import { frameBgClass } from './cardStyles';

export default function CardTile({ card }: { card: Card }) {
    const [failed, setFailed] = useState(false);

    return (
        <div title={card.name} className='relative aspect-card overflow-hidden rounded-card bg-surface-sunken shadow-card ring-1 ring-white/5'>
            {failed ? (
                // Image not available: frame color + name, so the card can still be recognized
                <div className={`flex h-full flex-col p-1.5 ${frameBgClass(card)}`}>
                    <div className='flex flex-1 items-center justify-center rounded-[2px] bg-night-950/75 p-2 text-center font-display text-caption font-semibold text-ink'>
                        {card.name}
                    </div>
                </div>
            ) : (
                <img src={cardImageUrl(card.id)} alt={card.name} loading='lazy' draggable={false} onError={() => setFailed(true)} className='h-full w-full object-cover'></img>
            )}
        </div>
    );
}
