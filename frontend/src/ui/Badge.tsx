import type { ReactNode } from 'react';
import { cn } from './styles';

export type BadgeTone = 'neutral' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';

const tones: Record<BadgeTone, string> = {
    neutral: 'border-line-strong bg-surface-overlay text-ink-muted',
    primary: 'border-aether-800 bg-aether-950 text-aether-300',
    secondary: 'border-arcane-800 bg-arcane-950 text-arcane-300',
    accent: 'border-relic-800 bg-relic-950 text-relic-300',
    success: 'border-success/40 bg-success/10 text-success',
    warning: 'border-warning/40 bg-warning/10 text-warning',
    danger: 'border-danger/40 bg-danger/10 text-danger',
};

export function Badge({ tone = 'neutral', className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-display text-micro font-semibold tracking-label uppercase',
                tones[tone],
                className,
            )}
        >
            {children}
        </span>
    );
}
