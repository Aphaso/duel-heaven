import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { DraftEntry } from '../draft';
import { entryKey } from '../draft';
import type { Card } from '../types';
import SortableCardGroup from './SortableCardGroup';

interface Props {
    entries: DraftEntry[];
    busy: boolean;
    canAddCopy: (card: Card) => boolean;
    onChange: (card: Card, quantity: number) => void;
    onReorder: (fromKey: string, toKey: string) => void;
}

/** Block = context -> Result: monsters, spells and traps cannot be mixed. */
export default function CardBlock({
    entries,
    busy,
    canAddCopy,
    onChange,
    onReorder,
}: Props) {
    const sensors = useSensors(
        // Start dragging after 6 pixels of movement
        useSensor(PointerSensor, { activationConstraint: { distance: 6} }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    function handleDragEnd({ active, over }: DragEndEvent) {
        if (over && active.id !== over.id) {
            onReorder(String(active.id), String(over.id));
        }
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={entries.map(entryKey)} strategy={rectSortingStrategy}>
                <div className='flex flex-wrap gap-x-4 gap-y-3'>
                    {entries.map((entry) => (
                        <SortableCardGroup key={entryKey(entry)} entry={entry} busy={busy} canAddCopy={canAddCopy(entry.card)} onChange={onChange}>
                        </SortableCardGroup>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}