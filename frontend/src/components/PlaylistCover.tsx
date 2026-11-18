import { cn } from '../ui/styles';

/** Cover gradients: written out in full so that Tailwind can find them. */
const GRADIENTS = [
    'from-aether-500 via-aether-800 to-night-950',
    'from-arcane-500 via-arcane-800 to-night-950',
    'from-relic-400 via-relic-800 to-night-950',
    'from-aether-400 via-arcane-700 to-night-950',
    'from-arcane-400 via-aether-800 to-night-950',
    'from-relic-300 via-arcane-800 to-night-950',
];

/** Stable number from a text (same id → same cover). */
function hashOf(text: string): number {
    let hash = 0;
    for (const char of text) {
        hash = (hash * 31 + char.charCodeAt(0)) | 0;
    }
    return Math.abs(hash);
}

/**
 * Generated cover of a playlist: a gradient chosen from the id and three card backs in a fan.
 * Decoration only: hidden to screen readers.
 */
export default function PlaylistCover({ seed, className }: { seed: string; className?: string }) {
    const gradient = GRADIENTS[hashOf(seed) % GRADIENTS.length];
    const card = 'absolute bottom-[18%] left-1/2 aspect-card w-[30%] rounded-[3px] border border-white/25 bg-night-950/55 shadow-card backdrop-blur-sm';
    return (
        <div aria-hidden='true' className={cn('relative aspect-square overflow-hidden rounded-control bg-gradient-to-br', gradient, className)}>
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgb(255_255_255/0.25),transparent_55%)]'></div>
            <div className={cn(card, '-translate-x-[95%] -rotate-[14deg]')}></div>
            <div className={cn(card, '-translate-x-[5%] rotate-[14deg]')}></div>
            <div className={cn(card, '-translate-x-1/2 -translate-y-[8%] grid place-items-center border-white/40 bg-night-950/70')}>
                <svg viewBox='0 0 24 24' className='w-1/2 text-white/85' fill='currentColor'>
                    <path d='M8 5.5v13l10-6.5-10-6.5Z' />
                </svg>
            </div>
        </div>
    );
}
