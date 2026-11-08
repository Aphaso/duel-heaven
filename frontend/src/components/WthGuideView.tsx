import { cardImageUrl } from '../api';
import type { Card, WthGuide } from '../types';

function CardFigure({ card, width }: { card: Card; width: string }) {
    return (
        <figure className={width}>
            <img src={cardImageUrl(card.id)} alt={card.name} draggable={false} className='w-full'></img>
            <figcaption className='truncate text-center text-xs' title={card.name}>
                {card.name}
            </figcaption>
        </figure>
    );
}

export default function WthGuideView({ guide }: { guide: WthGuide }) {
    return (
        <div className='space-y-4'>
            {guide.notes && <p className='text-gray-700'>{guide.notes}</p>}
            {guide.entries.map((entry) => (
                <section key={entry.id} className='rounded border p-3'>
                    <div className='flex flex-wrap items-center gap-4'>
                        <CardFigure card={entry.targetCard} width='w-28'></CardFigure>
                        <span aria-hidden className='text-3xl text-gray-400'>→</span>
                        <div className='flex flex-wrap gap-3'>
                            {entry.responses.map((r) => (
                                <CardFigure key={r.id} card={r.card} width='w-24'></CardFigure>
                            ))}
                        </div>
                    </div>
                    {entry.notes && <p className='mt-2 text-sm text-gray-600'>{entry.notes}</p>}
                </section>
            ))}
        </div>
    );
}