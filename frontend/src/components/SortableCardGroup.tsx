import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DraftEntry } from '../draft';
import { entryKey } from '../draft';
import type { Card } from '../types';
import CardTile from './CardTile';
import { TrashIcon } from '../ui/icons';
import { Stepper } from '../ui/Stepper';
import { cn } from '../ui/styles';

interface Props {
    entry: DraftEntry;
    canAddCopy: boolean;
    busy: boolean;
    onChange: (card: Card, quantity: number) => void;
}

export default function SortableCardGroup({
    entry,
    canAddCopy,
    busy,
    onChange,
}: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entryKey(entry), disabled: busy});

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={cn('group/card relative flex flex-col items-center gap-2', isDragging && 'z-10 opacity-70')}
        >
            {/* Only the images work as handles: the buttons below remain active. The copies overlap like a stack. */}
            <div
                {...attributes}
                {...listeners}
                aria-label={`Move ${entry.card.name}`}
                className={cn(
                    'focus-ring flex cursor-grab touch-none rounded-card active:cursor-grabbing',
                    isDragging && 'shadow-glow-primary',
                )}
            >
                {Array.from({ length: entry.quantity }, (_, i) => (
                    <div
                        key={i}
                        className={cn(
                            'w-card-sm transition-transform duration-200 sm:w-card-md',
                            i > 0 && '-ml-10 sm:-ml-14 group-hover/card:-ml-6 sm:group-hover/card:-ml-9',
                        )}
                    >
                        <CardTile card={entry.card}></CardTile>
                    </div>
                ))}
            </div>
            {entry.quantity > 1 && (
                <span aria-hidden='true' className='numeric pointer-events-none absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full border border-line-strong bg-surface-overlay text-micro font-bold text-ink shadow-card'>
                    ×{entry.quantity}
                </span>
            )}
            <div className='flex items-center gap-1'>
                <Stepper
                    itemLabel={entry.card.name}
                    onDecrement={() => onChange(entry.card, entry.quantity - 1)}
                    onIncrement={() => onChange(entry.card, entry.quantity + 1)}
                    decrementDisabled={busy}
                    incrementDisabled={busy || !canAddCopy}
                >
                    {entry.quantity}
                </Stepper>
                <button
                    type='button'
                    disabled={busy}
                    aria-label={`Remove ${entry.card.name}`}
                    onClick={() => onChange(entry.card, 0)}
                    className='focus-ring grid size-7 place-items-center rounded-control text-ink-faint transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-30'
                >
                    <TrashIcon className='size-3.5' />
                </button>
            </div>
        </div>
    );
}