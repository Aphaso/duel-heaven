import { cardImageUrl } from '../api';
import { copiesOf, type Candidate, type PatternDraftEntry } from '../sidePatternDraft';

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
    return (
        <section>
            <h4 className='mb-2 text-sm font-semibold'>{title}</h4>
            {candidates.length === 0 ? (
                <p className='text-sm text-gray-500'>No cards available.</p>
            ) : (
                <ul className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
                    {candidates.map((c) => {
                        const chosen = copiesOf(selected, c.card);
                        const blocked = blockedIds.has(c.card.id);
                        const canAdd = !blocked && chosen < c.available;
                        return (
                            <li
                                key={c.card.id}
                                className={`rounded border p-1 text-center ${
                                    chosen > 0 ? 'border-blue-500' : 'border-gray-300'
                                } ${blocked ? 'opacity-40' : ''}`}
                            >
                                <img
                                    src={cardImageUrl(c.card.id)}
                                    alt={c.card.name}
                                    draggable={false}
                                    className='mx-auto w-full'
                                />
                                <p className='truncate text-xs' title={c.card.name}>
                                    {c.card.name}
                                </p>
                                <div className='mt-1 flex items-center justify-center gap-2'>
                                    <button
                                        type='button'
                                        disabled={chosen === 0}
                                        onClick={() => onChange(c, chosen - 1)}
                                        className='rounded border px-2 disabled:opacity-30'
                                    >
                                        −
                                    </button>
                                    <span className='text-sm'>
                                        {chosen}/{c.available}
                                    </span>
                                    <button
                                        type='button'
                                        disabled={!canAdd}
                                        onClick={() => onChange(c, chosen + 1)}
                                        className='rounded border px-2 disabled:opacity-30'
                                    >
                                        +
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}