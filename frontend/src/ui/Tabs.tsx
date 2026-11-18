import type { ComponentType, SVGProps } from 'react';
import { cn } from './styles';

export interface TabItem<T extends string> {
    id: T;
    label: string;
    icon?: ComponentType<SVGProps<SVGSVGElement>>;
    /** Small dot next to the label (e.g. unsaved changes in that tab). */
    dot?: boolean;
}

interface Props<T extends string> {
    tabs: TabItem<T>[];
    value: T;
    onChange: (id: T) => void;
    label: string;
    className?: string;
}

/** Row of tabs with the active one underlined. The panels are rendered by the parent. */
export function Tabs<T extends string>({ tabs, value, onChange, label, className }: Props<T>) {
    return (
        <div role='tablist' aria-label={label} className={cn('scrollbar-thin flex gap-1 overflow-x-auto border-b border-line', className)}>
            {tabs.map((tab) => {
                const active = tab.id === value;
                return (
                    <button
                        key={tab.id}
                        type='button'
                        role='tab'
                        aria-selected={active}
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            'focus-ring relative flex shrink-0 items-center gap-2 px-4 py-3 font-display text-sm font-semibold tracking-wide transition-colors',
                            active ? 'text-ink' : 'text-ink-subtle hover:text-ink',
                        )}
                    >
                        {tab.icon && <tab.icon className={cn('size-4', active ? 'text-primary' : 'text-ink-faint')} />}
                        {tab.label}
                        {tab.dot && <span aria-label='unsaved changes' className='size-1.5 rounded-full bg-warning'></span>}
                        <span
                            aria-hidden='true'
                            className={cn(
                                'absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary shadow-glow-primary transition-opacity',
                                active ? 'opacity-100' : 'opacity-0',
                            )}
                        ></span>
                    </button>
                );
            })}
        </div>
    );
}
