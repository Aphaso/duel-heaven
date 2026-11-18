import type { ReactNode } from 'react';
import { cn } from './styles';

interface Props {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: ReactNode;
    description?: ReactNode;
    className?: string;
}

/** On/off toggle: a real checkbox with the look of a switch. */
export function Switch({ checked, onChange, label, description, className }: Props) {
    return (
        <label className={cn('flex cursor-pointer items-start gap-3', className)}>
            <input type='checkbox' role='switch' checked={checked} onChange={(e) => onChange(e.target.checked)} className='peer sr-only' />
            <span
                aria-hidden='true'
                className={cn(
                    'relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors',
                    'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary',
                    checked ? 'border-relic-500 bg-accent' : 'border-line-strong bg-surface-sunken',
                )}
            >
                <span
                    className={cn(
                        'absolute top-0.5 left-0.5 size-4.5 rounded-full shadow-card transition-transform',
                        checked ? 'translate-x-5 bg-ink-inverse' : 'bg-ink-subtle',
                    )}
                ></span>
            </span>
            <span className='min-w-0'>
                <span className='block text-sm font-semibold text-ink'>{label}</span>
                {description && <span className='block text-caption text-ink-subtle'>{description}</span>}
            </span>
        </label>
    );
}
