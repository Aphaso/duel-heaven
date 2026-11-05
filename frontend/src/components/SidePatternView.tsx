import { lanesOf, totalCopies } from '../sidePatternLanes';
import type { SidePattern, SidePatternCard } from '../types';
import CardTile from './CardTile';

const LANE_TITLE = { MAIN: 'Main Deck', EXTRA: 'Extra Deck' } as const;

/** One image per copy, grouped by card, same as the decklist */
function CardGroups({ entries }: { entries: SidePatternCard[] }) {
    return (
        <div className='flex flex-wrap gap-3'>
            {entries.map((entry) => (
                <div key={entry.id} className='flex gap-1 rounded bg-gray-50 p-1.5'>
                    {Array.from({ length: entry.quantity }, (_, i) => (
                        <div key={i} className='w-16 sm:w-20'>
                            <CardTile card={entry.card}></CardTile>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default function SidePatternView({ pattern }: { pattern : SidePattern }) {
    const lanes = lanesOf(pattern);

    return (
        <div>
            {pattern.issues.length > 0 && (
                <div className='rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800'>
                    <p className='font-medium'>
                        This Side Pattern no longer matches the saved Decklist:
                    </p>
                    <ul className='mt-1 list-disc pl-5'>
                        {pattern.issues.map((issue) => (
                            <li key={issue}>{issue}</li>
                        ))}
                    </ul>
                </div>
            )}

            {pattern.notes && <p className='mt-3 whitespace-pre-line text-gray-700'>{pattern.notes}</p>}

            {lanes.length === 0 && <p className='mt-4 text-sm text-gray-500'>No Cards in this Side Pattern.</p>}

            {lanes.map(({ lane, cardsOut, cardsIn }) => (
                <section key={lane} className='mt-6'>
                    <h3 className='text-lg font-semibold'>
                        {LANE_TITLE[lane]}
                        <span className='ml-2 text-sm font-normal text-gray-500'>
                            {totalCopies(cardsOut)} out · {totalCopies(cardsIn)} in
                        </span>
                    </h3>
                    <div className='mt-2 grid gap-4 md:grid-cols-2'>
                        <div>
                            <p className='mb-1 text-xs font-medium uppercase tracking-wide text-red-700'>
                                Out
                            </p>
                            <CardGroups entries={cardsOut}></CardGroups>
                        </div>
                        <div>
                            <p className='mb-1 text-xs font-medium uppercase tracking-wide text-green-700'>
                                In
                            </p>
                            <CardGroups entries={cardsIn}></CardGroups>
                        </div>
                    </div>
                </section>
            ))}
        </div>
    );
}