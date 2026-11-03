import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DraftEntry } from '../draft';
import { entryKey } from '../draft';
import type { Card } from '../types';
import CardTile from './CardTile';

interface Props {
    entry: DraftEntry;
    canAddCopy: boolean;
    busy: boolean;
    onChange: (card: Card, quantity: number) => void;
}

const smallButton = 'rounded border border-gray-300 px-2 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40';

export default function SortableCardGroup({
    entry,
    canAddCopy,
    busy,
    onChange,
}: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entryKey(entry), disabled: busy});

    return (
        <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`rounded bg-gray-50 p-1.5 ${isDragging ? 'z-10 opacity-60 shadow-lg' : ''}`}>
            {/* Only the images work as handles: the buttons below remain active. */}
            <div {...attributes} {...listeners} aria-label={`Move ${entry.card.name}`} className='flex cursor-grab touch-none gap-1 active:cursor-grabbing'>
                {Array.from({ length: entry.quantity }, (_, i) => (
                    <div key={i} className='w-20 sm:w-24'>
                        <CardTile card={entry.card}></CardTile>
                    </div>
                ))}
            </div>
            <div className='mt-1 flex justify-center gap-1'>
                <button className={smallButton} disabled={busy} aria-label={`Remove one copy of ${entry.card.name}`} onClick={() => onChange(entry.card, entry.quantity - 1)}>
                    -
                </button>
                <button className={smallButton} disabled={busy || !canAddCopy} aria-label={`Add one copy of ${entry.card.name}`} onClick={() => onChange(entry.card, entry.quantity + 1)}>
                    +
                </button>
                <button className={`${smallButton} text-red-700`} disabled={busy} aria-label={`Remove ${entry.card.name}`} onClick={() => onChange(entry.card, 0)}>
                    ✕
                </button>
            </div>
        </div>
    );
}