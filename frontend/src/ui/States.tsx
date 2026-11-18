import type { ReactNode } from 'react';
import { Spinner } from './Spinner';
import { cn } from './styles';

export function LoadingState({ label = 'Loading...', className }: { label?: string; className?: string }) {
    return (
        <div role='status' className={cn('flex items-center gap-3 py-6 text-sm text-ink-subtle', className)}>
            <Spinner className='text-primary' />
            {label}
        </div>
    );
}

export function ErrorMessage({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            role='alert'
            className={cn('whitespace-pre-line rounded-control border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger', className)}
        >
            {children}
        </div>
    );
}

interface EmptyProps {
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    icon?: ReactNode;
    className?: string;
}

export function EmptyState({ title, description, action, icon, className }: EmptyProps) {
    return (
        <div className={cn('flex flex-col items-center gap-3 rounded-panel border border-dashed border-line-strong px-6 py-12 text-center', className)}>
            {icon && <div className='text-ink-faint [&_svg]:size-10'>{icon}</div>}
            <p className='font-display text-heading text-ink'>{title}</p>
            {description && <p className='max-w-sm text-sm text-ink-subtle'>{description}</p>}
            {action && <div className='mt-2'>{action}</div>}
        </div>
    );
}
