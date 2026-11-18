import type { ButtonHTMLAttributes } from 'react';
import { buttonStyles, type ButtonSize, type ButtonVariant } from './styles';
import { Spinner } from './Spinner';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Shows a spinner and disables the button. */
    loading?: boolean;
}

export function Button({ variant, size, loading, className, disabled, children, type = 'button', ...rest }: Props) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={buttonStyles({ variant, size, className })}
            {...rest}
        >
            {loading && <Spinner className='size-4' />}
            {children}
        </button>
    );
}
