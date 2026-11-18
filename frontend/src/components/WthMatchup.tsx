import type { ReactNode } from 'react';
import type { Card } from '../types';
import CardTile from './CardTile';
import { cn } from '../ui/styles';

/** Opponent card (the threat) on the left, the answers on the right, joined by an arrow. */
export function WthMatchup({
    index,
    target,
    targetActions,
    responses,
    footer,
    className,
}: {
    index: number;
    target: Card;
    /** Buttons under the opponent card (editor only). */
    targetActions?: ReactNode;
    /** The list of the answers: already laid out by the parent. */
    responses: ReactNode;
    footer?: ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('overflow-hidden rounded-panel border border-line bg-surface-raised shadow-panel', className)}>
            <div className='flex flex-col sm:flex-row'>
                {/* Threat */}
                <div className='relative flex shrink-0 flex-col items-center gap-2 border-b border-line bg-danger/5 p-4 sm:w-48 sm:border-r sm:border-b-0'>
                    <div className='flex w-full items-center justify-between'>
                        <span className='label text-danger'>Threat</span>
                        <span className='numeric text-caption text-ink-faint'>#{index}</span>
                    </div>
                    <div className='w-card-lg max-w-full rounded-card ring-1 ring-danger/40'>
                        <CardTile card={target}></CardTile>
                    </div>
                    <p className='w-full truncate text-center text-sm font-semibold text-ink' title={target.name}>
                        {target.name}
                    </p>
                    {targetActions}
                </div>

                {/* Arrow between the two sides */}
                <div aria-hidden='true' className='flex items-center justify-center py-1 text-ink-faint sm:px-1 sm:py-0'>
                    <svg viewBox='0 0 24 24' className='size-6 rotate-90 sm:rotate-0' fill='none' stroke='currentColor' strokeWidth={1.75} strokeLinecap='round' strokeLinejoin='round'>
                        <path d='M5 12h14M13 6l6 6-6 6' />
                    </svg>
                </div>

                {/* Answers */}
                <div className='min-w-0 flex-1 space-y-3 p-4 pt-0 sm:pt-4'>
                    <span className='label text-primary'>Hit with</span>
                    {responses}
                </div>
            </div>
            {footer && <div className='border-t border-line bg-surface-sunken/50 px-4 py-3'>{footer}</div>}
        </section>
    );
}
