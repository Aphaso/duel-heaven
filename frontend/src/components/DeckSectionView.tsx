import type { DeckCardEntry } from '../types';
import CardTile from './CardTile';

interface Props {
    title: string;
    entries: DeckCardEntry[];
    count: number;
    min?: number;
    max: number;
    maxCopies: number;
    copiesByCard: Record<number, number>;
    busy: boolean;
    onChange: (cardId: number, quantity: number) => void;
}

const smallButton = 'rounded border border-gray-300 px-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40';

export default function DeckSectionView({
    title,
    entries,
    count,
    min,
    max,
    maxCopies,
    copiesByCard,
    busy,
    onChange,
}: Props) {
    const belowMin = min !== undefined && count < min;

    return (
        <section className='mt-8 first:mt-0'>
            <h2 className='flex items-baseline gap-2 text-xl font-semibold'>
                {title}
                <span className={`text-sm font-normal ${belowMin ? 'text-amber-700' : 'text-gray-500'}`}>
                    {count}/{max}
                    {min !== undefined && ` (minimum ${min})`}
                </span>
            </h2>

            {entries.length === 0 ? (
                <p className='mt-2 text-sm text-gray-500'>No Cards.</p>
            ) : (
                <div className='mt-3 flex flex-wrap gap-3'>
                    {entries.map((entry) => (
                        <div key={entry.id} className='rounded bg-gray-50 p-1.5'>
                            <div className='flex gap-1'>
                                {Array.from({ length: entry.quantity }, (_, i) => (
                                    <div key={i} className='w-20 sm:w-24'>
                                        <CardTile card={entry.card}></CardTile>
                                    </div>
                                ))}
                            </div>
                            <div className='mt-1 flex justify-center gap-1'>
                                <button
                                    className={smallButton}
                                    disabled={busy}
                                    aria-label={`Removed one copy of ${entry.card.name}`}
                                    onClick={() => onChange(entry.cardId, entry.quantity - 1)}
                                >
                                    -
                                </button>
                                <button
                                    className={smallButton}
                                    disabled={busy || (copiesByCard[entry.cardId] ?? 0) >= maxCopies}
                                    aria-label={`Added one copy of ${entry.card.name}`}
                                    onClick={() => onChange(entry.cardId, entry.quantity + 1)}
                                >
                                    +
                                </button>
                                <button
                                    className={`${smallButton} text-red-700`}
                                    disabled={busy}
                                    aria-label={`Remove ${entry.card.name}`}
                                    onClick={() => onChange(entry.cardId, 0)}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}