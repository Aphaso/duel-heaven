import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { EyeIcon, EyeOffIcon } from './icons';
import { cn, fieldStyles } from './styles';

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
    return <input className={cn(fieldStyles, 'h-10', className)} {...rest} />;
}

/** Password input with a button to show/hide what has been typed. */
export function PasswordInput({ className, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
    const [visible, setVisible] = useState(false);
    return (
        <div className='relative'>
            <input type={visible ? 'text' : 'password'} className={cn(fieldStyles, 'h-10 pr-11', className)} {...rest} />
            <button
                type='button'
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? 'Hide password' : 'Show password'}
                aria-pressed={visible}
                className='focus-ring absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-control text-ink-subtle hover:text-ink'
            >
                {visible ? <EyeOffIcon className='size-4' /> : <EyeIcon className='size-4' />}
            </button>
        </div>
    );
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

/** Props to spread on the control inside a <Field>, to link it to label, hint and error. */
export interface FieldControlProps {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: true;
}

export type HintTone = 'neutral' | 'success' | 'danger' | 'pending';

const hintTones: Record<HintTone, string> = {
    neutral: 'text-ink-subtle',
    success: 'text-success',
    danger: 'text-danger',
    pending: 'text-ink-subtle',
};

interface FieldProps {
    label: ReactNode;
    hint?: ReactNode;
    /** Color of the hint: e.g. green when a username is available. */
    hintTone?: HintTone;
    /** When present it replaces the hint and marks the control as invalid. */
    error?: ReactNode;
    className?: string;
    children: (control: FieldControlProps) => ReactNode;
}

/** Label + control + hint/error, with the accessibility links already in place. */
export function Field({ label, hint, hintTone = 'neutral', error, className, children }: FieldProps) {
    const id = useId();
    const messageId = `${id}-message`;
    const message = error ?? hint;
    return (
        <div className={cn('space-y-1.5', className)}>
            <label htmlFor={id} className='label block text-ink-muted'>
                {label}
            </label>
            {children({
                id,
                'aria-describedby': message ? messageId : undefined,
                'aria-invalid': error ? true : undefined,
            })}
            {message && (
                <p id={messageId} aria-live='polite' className={cn('text-caption', error ? 'text-danger' : hintTones[hintTone])}>
                    {message}
                </p>
            )}
        </div>
    );
}
