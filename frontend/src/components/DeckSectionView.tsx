import { CATEGORY_LABEL, type Block } from '../draft';
import type { Card, DeckSection } from '../types';
import CardBlock from './CardBlock';
import { ZONE_STYLES } from './deckZones';
import { cn, panelStyles } from '../ui/styles';

interface Props {
    section: DeckSection;
    title: string;
    blocks: Block[];
    count: number;
    min?: number;
    max: number;
    canAddCopy: (card: Card) => boolean;
    busy: boolean;
    onChange: (card: Card, quantity: number) => void;
    onReorder: (fromKey: string, toKey: string) => void;
}

export default function DeckSectionView({
    section,
    title,
    blocks,
    count,
    min,
    max,
    canAddCopy,
    busy,
    onChange,
    onReorder,
}: Props) {
    const belowMin = min !== undefined && count < min;
    const zone = ZONE_STYLES[section];

    return (
        <section aria-label={title} className={cn(panelStyles, 'border-l-2', zone.border)}>
            <header className='flex items-center justify-between gap-3 border-b border-line px-panel py-3'>
                <h2 className='flex items-center gap-2.5 font-display text-heading text-ink'>
                    <span aria-hidden='true' className={cn('size-2 rounded-full', zone.dot)}></span>
                    {title}
                </h2>
                <span className={cn('numeric text-sm', belowMin ? 'text-warning' : 'text-ink-subtle')}>
                    <span className={belowMin ? undefined : 'text-ink'}>{count}</span>/{max}
                    {min !== undefined && <span className='ml-1 text-caption text-ink-faint'>(min {min})</span>}
                </span>
            </header>

            <div className='space-y-5 p-panel'>
                {blocks.length === 0 ? (
                    <p className='rounded-control border border-dashed border-line-strong py-6 text-center text-sm text-ink-faint'>
                        No Cards. Add them from the search panel.
                    </p>
                ) : (
                    blocks.map((block) => (
                        <div key={block.category}>
                            {/* No label for the Extra Deck */}
                            {section !== 'EXTRA' && (
                                <p className='label mb-2 text-ink-subtle'>
                                    {CATEGORY_LABEL[block.category]}
                                    <span className='numeric ml-2 text-ink-faint'>{block.entries.reduce((sum, e) => sum + e.quantity, 0)}</span>
                                </p>
                            )}
                            <CardBlock entries={block.entries} busy={busy} canAddCopy={canAddCopy} onChange={onChange} onReorder={onReorder}>
                            </CardBlock>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}