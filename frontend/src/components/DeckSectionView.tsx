import { CATEGORY_LABEL, type Block } from '../draft';
import type { Card, DeckSection } from '../types';
import CardBlock from './CardBlock';

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

    return (
        <section className='mt-8 first:mt-0'>
            <h2 className='flex items-baseline gap-2 text-xl font-semibold'>
                {title}
                <span className={`text-sm font-normal ${belowMin ? 'text-amber-700' : 'text-gray-500'}`}>
                    {count}/{max}
                    {min !== undefined && ` (${min} minimum)`}
                </span>
            </h2>

            {blocks.length === 0 ? (
                <p className='mt-2 text-sm text-gray-500'>No Cards.</p>
            ) : (
                blocks.map((block) => (
                    <div key={block.category} className='mt-3'>
                        {/* No label for the Extra Deck */}
                        {section !== 'EXTRA' && (
                            <p className='mb-1 text-xs font-medium- uppercase tracking-wide text-gray-500'>
                                {CATEGORY_LABEL[block.category]}
                            </p>
                        )}
                        <CardBlock entries={block.entries} busy={busy} canAddCopy={canAddCopy} onChange={onChange} onReorder={onReorder}>
                        </CardBlock>
                    </div>
                ))
            )}
        </section>
    );
}