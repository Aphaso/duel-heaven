import type { InputHTMLAttributes, Ref } from 'react';
import { CloseIcon, SearchIcon } from './icons';
import { Spinner } from './Spinner';
import { cn, fieldStyles } from './styles';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
    value: string;
    onValueChange: (value: string) => void;
    /** Shows a spinner in place of the magnifier while results are loading. */
    loading?: boolean;
    size?: 'md' | 'lg';
    /** Hint of the keyboard shortcut that focuses the field (e.g. "/"). */
    shortcut?: string;
    ref?: Ref<HTMLInputElement>;
}

export function SearchInput({ value, onValueChange, loading, size = 'md', shortcut, className, ref, ...rest }: Props) {
    const large = size === 'lg';
    return (
        <div className={cn('relative', className)}>
            <span className={cn('pointer-events-none absolute inset-y-0 grid place-items-center text-ink-subtle', large ? 'left-4' : 'left-3')}>
                {loading ? <Spinner className={large ? 'size-5' : 'size-4'} /> : <SearchIcon className={large ? 'size-5' : 'size-4'} />}
            </span>
            <input
                ref={ref}
                type='search'
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                className={cn(
                    fieldStyles,
                    '[&::-webkit-search-cancel-button]:hidden',
                    large ? 'h-14 rounded-panel pr-24 pl-12 text-base' : 'h-10 pr-9 pl-9',
                )}
                {...rest}
            />
            <div className={cn('absolute inset-y-0 flex items-center gap-2', large ? 'right-3' : 'right-2')}>
                {value !== '' ? (
                    <button
                        type='button'
                        onClick={() => onValueChange('')}
                        aria-label='Clear search'
                        className='focus-ring grid size-7 place-items-center rounded-control text-ink-subtle hover:bg-surface-hover hover:text-ink'
                    >
                        <CloseIcon className='size-4' />
                    </button>
                ) : (
                    shortcut && (
                        <kbd className='hidden rounded border border-line-strong bg-surface-raised px-1.5 py-0.5 font-mono text-micro text-ink-subtle sm:block'>
                            {shortcut}
                        </kbd>
                    )
                )}
            </div>
        </div>
    );
}
