import type { ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
    id: string;
    // Used for the accessible name of the handle
    name: string;
    disabled?: boolean;
    children: ReactNode;
}

/** A row of the playlist that can be dragged by its handle */
export default function SortableComboRow({ id, name, disabled = false, children }: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });

    return (
        <li
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`flex items-center gap-2 rounded border bg-white p-2 ${isDragging ? 'relative z-10 opacity-60 shadow-lg' : ''}`}
        >
            {/* Only the handle starts the drag: the buttons on the right remain active */}
            <button
                type='button'
                disabled={disabled}
                aria-label={`Move ${name}`}
                className='cursor-grab touch-none px-1 text-gray-400 hover:text-gray-700 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40'
                {...attributes}
                {...listeners}
            >
                ⠿
            </button>
            {children}
        </li>
    );
}