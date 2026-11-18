import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn, fieldStyles } from './styles';

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
    return <input className={cn(fieldStyles, 'h-10', className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea className={cn(fieldStyles, 'min-h-24 resize-y', className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <select className={cn(fieldStyles, 'h-10 pr-8', className)} {...rest}>
            {children}
        </select>
    );
}

interface FieldProps {
    label: ReactNode;
    hint?: ReactNode;
    error?: ReactNode;
    className?: string;
    /** Receives the id to put on the control, so that the label points to it. */
    children: (id: string) => ReactNode;
}

/** Label + control + hint/error, with the accessibility links already in place. */
export function Field({ label, hint, error, className, children }: FieldProps) {
    const id = useId();
    return (
        <div className={cn('space-y-1.5', className)}>
            <label htmlFor={id} className='label block text-ink-muted'>
                {label}
            </label>
            {children(id)}
            {error ? (
                <p className='text-caption text-danger'>{error}</p>
            ) : (
                hint && <p className='text-caption text-ink-subtle'>{hint}</p>
            )}
        </div>
    );
}
