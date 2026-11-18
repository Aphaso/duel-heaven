import type { InputHTMLAttributes } from 'react';
import type { HintTone } from '../ui/Field';
import { CheckIcon } from '../ui/icons';
import { Spinner } from '../ui/Spinner';
import { cn, fieldStyles } from '../ui/styles';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
    /** State of the availability check, shown as an icon on the right. */
    status?: HintTone;
}

/** Username input: "@" prefix and availability indicator. */
export function UsernameInput({ status = 'neutral', className, ...rest }: Props) {
    return (
        <div className='relative'>
            <span aria-hidden='true' className='pointer-events-none absolute inset-y-0 left-3 grid place-items-center font-mono text-sm text-ink-faint'>
                @
            </span>
            <input
                spellCheck={false}
                className={cn(fieldStyles, 'h-10 pr-10 pl-7', status === 'success' && 'border-success/60', className)}
                {...rest}
            />
            <span aria-hidden='true' className='pointer-events-none absolute inset-y-0 right-3 grid place-items-center'>
                {status === 'pending' && <Spinner className='size-4 text-ink-subtle' />}
                {status === 'success' && <CheckIcon className='size-4 text-success' />}
            </span>
        </div>
    );
}
