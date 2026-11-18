import type { DeckSection } from '../types';
import { cn } from '../ui/styles';
import { ZONE_STYLES } from './deckZones';

interface Props {
    section: DeckSection;
    label: string;
    count: number;
    max: number;
    min?: number;
    className?: string;
}

/** Counter of a deck zone with a progress bar: amber below the minimum. */
export default function ZoneMeter({ section, label, count, max, min, className }: Props) {
    const belowMin = min !== undefined && count < min;
    const percent = Math.min(100, (count / max) * 100);
    const zone = ZONE_STYLES[section];
    return (
        <div className={cn('min-w-24 space-y-1', className)}>
            <div className='flex items-baseline justify-between gap-3'>
                <span className={cn('label', zone.text)}>{label}</span>
                <span className={cn('numeric text-caption', belowMin ? 'text-warning' : 'text-ink-muted')}>
                    <span className={belowMin ? undefined : 'text-ink'}>{count}</span>/{max}
                </span>
            </div>
            <div className='relative h-1 overflow-hidden rounded-full bg-surface-sunken'>
                <div className={cn('h-full rounded-full transition-[width] duration-300', belowMin ? 'bg-warning' : zone.bar)} style={{ width: `${percent}%` }}></div>
                {min !== undefined && (
                    // Notch at the minimum
                    <div aria-hidden='true' className='absolute inset-y-0 w-px bg-ink-faint' style={{ left: `${(min / max) * 100}%` }}></div>
                )}
            </div>
        </div>
    );
}
