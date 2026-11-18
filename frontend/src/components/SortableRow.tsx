import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripIcon } from '../ui/icons';

interface Props {
    id: string;
    // Used for the accessible name of the handle
    name: string;
    disabled?: boolean;
    children: ReactNode;
}

/** A row of the playlist that can be dragged by its handle */
export default function SortableRow({ id, name, disabled = false, children }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });

    return (
        <li
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`flex items-center gap-2 rounded-control border border-line bg-surface-raised p-2 transition-colors hover:border-line-strong ${isDragging ? 'relative z-10 border-primary opacity-80 shadow-glow-primary' : ''}`}
        >
            {/* Only the handle starts the drag: the buttons on the right remain active */}
            <button
                type='button'
                disabled={disabled}
                aria-label={`Move ${name}`}
                className='focus-ring grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-control text-ink-faint hover:bg-surface-hover hover:text-ink active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40'
                {...attributes}
                {...listeners}
            >
                <GripIcon className='size-4' />
            </button>
            {children}
        </li>
    );
}