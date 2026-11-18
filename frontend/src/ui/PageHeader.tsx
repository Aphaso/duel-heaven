import type { ReactNode } from 'react';
import { cn } from './styles';

interface Props {
    title: ReactNode;
    /** Small label above the title (e.g. the section: "Deckbuilder"). */
    eyebrow?: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({ title, eyebrow, description, actions, className }: Props) {
    return (
        <header className={cn('flex flex-wrap items-end justify-between gap-4', className)}>
            <div className='min-w-0 space-y-1'>
                {eyebrow && <p className='label text-primary'>{eyebrow}</p>}
                <h1 className='font-display text-title text-ink'>{title}</h1>
                {description && <p className='max-w-2xl text-sm text-ink-subtle'>{description}</p>}
            </div>
            {actions && <div className='flex flex-wrap items-center gap-2'>{actions}</div>}
        </header>
    );
}

/** Standard page container: width, side gutters and spacing between sections. */
export function Page({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <main className={cn('mx-auto w-full max-w-page space-y-8 px-gutter py-8 lg:px-gutter-lg', className)}>
            {children}
        </main>
    );
}
