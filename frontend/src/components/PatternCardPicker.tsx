import { copiesOf, type Candidate, type PatternDraftEntry } from '../sidePatternDraft';
import CardTile from './CardTile';
import { Stepper } from '../ui/Stepper';
import { cn } from '../ui/styles';

interface Props {
    title: string;
    candidates: Candidate[];
    selected: PatternDraftEntry[];
    /** Cards chosen in the other list: a card cannot go both out and in. */
    blockedIds: Set<number>;
    onChange: (candidate: Candidate, quantity: number) => void;
}

export default function PatternCardPicker({
    title,
    candidates,
    selected,
    blockedIds,
    onChange,
}: Props) {
    const out = title === 'Out';
    return (
        <section>
            <h4 className={cn('label mb-3', out ? 'text-danger' : 'text-success')}>{title}</h4>
            {candidates.length === 0 ? (
                <p className='text-sm text-ink-subtle'>No cards available.</p>
            ) : (
                <ul className='grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-3 xl:grid-cols-4'>
                    {candidates.map((c) => {
                        const chosen = copiesOf(selected, c.card);
                        const blocked = blockedIds.has(c.card.id);
                        const canAdd = !blocked && chosen < c.available;
                        return (
                            <li
                                key={c.card.id}
                                className={cn('flex flex-col items-center gap-1.5 text-center transition-opacity', blocked && 'opacity-35')}
                            >
                                <div
                                    className={cn(
                                        'w-full rounded-card ring-2 transition-shadow',
                                        chosen > 0 ? (out ? 'ring-danger' : 'ring-success') : 'ring-transparent',
                                    )}
                                >
                                    <CardTile card={c.card}></CardTile>
                                </div>
                                <p className='w-full truncate text-micro text-ink-muted' title={c.card.name}>
                                    {c.card.name}
                                </p>
                                <Stepper
                                    itemLabel={c.card.name}
                                    onDecrement={() => onChange(c, chosen - 1)}
                                    onIncrement={() => onChange(c, chosen + 1)}
                                    decrementDisabled={chosen === 0}
                                    incrementDisabled={!canAdd}
                                >
                                    {chosen}/{c.available}
                                </Stepper>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}