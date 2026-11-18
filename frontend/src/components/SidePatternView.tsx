import { lanesOf, totalCopies } from '../sidePatternLanes';
import type { SidePattern, SidePatternCard } from '../types';
import CardTile from './CardTile';
import { Notice } from '../ui/States';

const LANE_TITLE = { MAIN: 'Main Deck', EXTRA: 'Extra Deck' } as const;

/** One image per copy, grouped by card, same as the decklist */
function CardGroups({ entries }: { entries: SidePatternCard[] }) {
    return (
        <div className='flex flex-wrap gap-x-3 gap-y-2'>
            {entries.map((entry) => (
                <div key={entry.id} className='flex' title={`${entry.quantity}× ${entry.card.name}`}>
                    {Array.from({ length: entry.quantity }, (_, i) => (
                        <div key={i} className={i > 0 ? '-ml-8 w-card-sm' : 'w-card-sm'}>
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
        <div className='space-y-5'>
            {pattern.issues.length > 0 && (
                <Notice title='This Side Pattern no longer matches the saved Decklist:'>
                    <ul className='list-disc space-y-0.5 pl-5'>
                        {pattern.issues.map((issue) => (
                            <li key={issue}>{issue}</li>
                        ))}
                    </ul>
                </Notice>
            )}

            {pattern.notes && (
                <p className='rounded-control border-l-2 border-line-strong bg-surface-sunken px-4 py-3 text-sm whitespace-pre-line text-ink-muted'>{pattern.notes}</p>
            )}

            {lanes.length === 0 && <p className='text-sm text-ink-subtle'>No Cards in this Side Pattern.</p>}

            {lanes.map(({ lane, cardsOut, cardsIn }) => (
                <section key={lane} className='space-y-3'>
                    <h3 className='flex items-baseline gap-3 font-display text-heading text-ink'>
                        {LANE_TITLE[lane]}
                        <span className='numeric text-caption text-ink-subtle'>
                            {totalCopies(cardsOut)} out · {totalCopies(cardsIn)} in
                        </span>
                    </h3>
                    <div className='grid gap-3 md:grid-cols-2'>
                        <div className='rounded-control border border-danger/25 bg-danger/5 p-3'>
                            <p className='label mb-2 flex items-center gap-1.5 text-danger'>
                                <span aria-hidden='true'>−</span> Out
                            </p>
                            <CardGroups entries={cardsOut}></CardGroups>
                        </div>
                        <div className='rounded-control border border-success/25 bg-success/5 p-3'>
                            <p className='label mb-2 flex items-center gap-1.5 text-success'>
                                <span aria-hidden='true'>+</span> In
                            </p>
                            <CardGroups entries={cardsIn}></CardGroups>
                        </div>
                    </div>
                </section>
            ))}
        </div>
    );
}