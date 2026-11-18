/**
 * Class recipes of the design system, shared by the UI components and usable
 * directly on elements that cannot be a component (e.g. <Link>, <NavLink>).
 */

/** Joins class names, skipping the falsy ones. */
export function cn(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(' ');
}

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const buttonBase =
    'focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-display font-semibold tracking-wide ' +
    'transition-[background-color,border-color,color,box-shadow] duration-150 select-none ' +
    'disabled:pointer-events-none disabled:opacity-40';

const buttonVariants: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-ink-inverse hover:bg-primary-hover hover:shadow-glow-primary active:bg-primary-active',
    secondary: 'border border-line-strong bg-surface-raised text-ink hover:border-aether-700 hover:bg-surface-hover',
    ghost: 'text-ink-muted hover:bg-surface-hover hover:text-ink',
    danger: 'border border-danger/40 bg-danger/10 text-danger hover:border-danger hover:bg-danger/20',
    'danger-ghost': 'text-danger/80 hover:bg-danger/10 hover:text-danger',
    accent: 'bg-accent text-ink-inverse hover:bg-relic-300 hover:shadow-glow-accent active:bg-relic-500',
};

const buttonSizes: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-caption',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
    icon: 'size-9',
};

export function buttonStyles({
    variant = 'secondary',
    size = 'md',
    className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
    return cn(buttonBase, buttonVariants[variant], buttonSizes[size], className);
}

/** Text inputs, selects and textareas. */
export const fieldStyles =
    'focus-ring block w-full rounded-control border border-line-strong bg-surface-sunken px-3 py-2 text-sm text-ink ' +
    'placeholder:text-ink-faint transition-colors hover:border-night-500 focus:border-primary ' +
    'disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger';

/** Container of a section: list, form, editor. */
export const panelStyles = 'rounded-panel border border-line bg-surface-raised shadow-panel';

/** Clickable link inside text. */
export const linkStyles = 'font-medium text-primary underline-offset-4 hover:text-primary-hover hover:underline';
