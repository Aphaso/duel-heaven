import { useId } from 'react';
import { cn } from './styles';

/** Duel Heaven mark: a card seen edge-on inside a halo. */
export function LogoMark({ className }: { className?: string }) {
    const gradient = useId();
    return (
        <svg viewBox='0 0 32 32' aria-hidden='true' className={cn('size-8', className)}>
            <defs>
                <linearGradient id={gradient} x1='0' y1='0' x2='1' y2='1'>
                    <stop offset='0' stopColor='var(--color-aether-300)' />
                    <stop offset='1' stopColor='var(--color-arcane-400)' />
                </linearGradient>
            </defs>
            <ellipse cx='16' cy='7' rx='9' ry='2.6' fill='none' stroke='var(--color-relic-400)' strokeWidth='1.6' />
            <path d='M16 9.5 25 19l-9 10-9-10 9-9.5Z' fill={`url(#${gradient})`} />
            <path d='M16 13.5 21.2 19 16 24.8 10.8 19 16 13.5Z' fill='var(--color-surface-base)' opacity='0.85' />
        </svg>
    );
}

export function Logo({ className }: { className?: string }) {
    return (
        <span className={cn('inline-flex items-center gap-2.5', className)}>
            <LogoMark />
            <span className='font-display text-lg leading-none font-bold tracking-[0.12em] text-ink uppercase'>
                Duel<span className='text-primary'>Heaven</span>
            </span>
        </span>
    );
}
