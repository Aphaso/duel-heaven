import type { ReactNode } from 'react';
import { cn } from './styles';

interface Props {
    /** Text between the two buttons (e.g. "2/3"). */
    children: ReactNode;
    onDecrement: () => void;
    onIncrement: () => void;
    decrementDisabled?: boolean;
    incrementDisabled?: boolean;
    /** Name of the thing being counted, for the screen readers labels. */
    itemLabel: string;
    decrementLabel?: string;
    incrementLabel?: string;
    className?: string;
}

const stepButton =
    'focus-ring grid size-7 place-items-center text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink ' +
    'disabled:pointer-events-none disabled:opacity-30';

/** Compact − value + control for the number of copies. */
export function Stepper({
    children,
    onDecrement,
    onIncrement,
    decrementDisabled,
    incrementDisabled,
    itemLabel,
    decrementLabel,
    incrementLabel,
    className,
}: Props) {
    return (
        <div className={cn('inline-flex items-center overflow-hidden rounded-control border border-line-strong bg-surface-sunken', className)}>
            <button
                type='button'
                onClick={onDecrement}
                disabled={decrementDisabled}
                aria-label={decrementLabel ?? `Remove one copy of ${itemLabel}`}
                className={stepButton}
            >
                −
            </button>
            <span className='numeric min-w-8 px-1 text-center text-caption text-ink'>{children}</span>
            <button
                type='button'
                onClick={onIncrement}
                disabled={incrementDisabled}
                aria-label={incrementLabel ?? `Add one copy of ${itemLabel}`}
                className={stepButton}
            >
                +
            </button>
        </div>
    );
}
