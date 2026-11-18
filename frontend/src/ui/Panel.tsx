import type { HTMLAttributes, ReactNode } from 'react';
import { cn, panelStyles } from './styles';

interface Props extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    title?: ReactNode;
    /** Content aligned to the right of the title (buttons, counters). */
    actions?: ReactNode;
    /** Removes the inner padding, for lists that go edge to edge. */
    flush?: boolean;
    /** Classes for the body (e.g. to make it a scrollable flex column). */
    bodyClassName?: string;
}

export function Panel({ title, actions, flush, bodyClassName, className, children, ...rest }: Props) {
    return (
        <section className={cn(panelStyles, className)} {...rest}>
            {(title || actions) && (
                <header className='flex items-center justify-between gap-3 border-b border-line px-panel py-3'>
                    {title && <h2 className='label text-ink-muted'>{title}</h2>}
                    {actions && <div className='flex items-center gap-2'>{actions}</div>}
                </header>
            )}
            <div className={cn(!flush && 'p-panel', bodyClassName)}>{children}</div>
        </section>
    );
}
