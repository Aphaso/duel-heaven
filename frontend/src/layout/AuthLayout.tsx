import type { ReactNode } from 'react';
import { Logo, LogoMark } from '../ui/Logo';
import { BoltIcon, CardsIcon, DeckIcon, PlaylistIcon, ShieldIcon } from '../ui/icons';

const FEATURES = [
    { icon: CardsIcon, title: 'Card database', text: 'Search every card by name, type and attribute.' },
    { icon: DeckIcon, title: 'Decklists & Side Patterns', text: 'Build your deck and plan what to side in and out.' },
    { icon: ShieldIcon, title: 'WTH? guides', text: 'Know where to hit the opponent with your handtraps.' },
    { icon: BoltIcon, title: 'Combos', text: 'Record lines step by step and replay them on the board.' },
    { icon: PlaylistIcon, title: 'Playlists', text: 'Collect your combos and sell them on the Store.', accent: true },
];

interface Props {
    title: ReactNode;
    description?: ReactNode;
    /** Line under the form (e.g. link to switch between login and registration). */
    footer?: ReactNode;
    children: ReactNode;
}

/** Screen for the pages outside the app: brand showcase on the left, form on the right. */
export function AuthLayout({ title, description, footer, children }: Props) {
    return (
        <div className='grid min-h-dvh lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]'>
            <Showcase />

            <main className='flex flex-col items-center justify-center px-gutter py-10 sm:py-16'>
                <div className='w-full max-w-md animate-rise-in'>
                    <Logo className='mb-10 lg:hidden' />
                    <div className='rounded-panel border border-line bg-surface-raised/80 p-6 shadow-panel backdrop-blur sm:p-8'>
                        <header className='mb-6 space-y-1.5'>
                            <h1 className='font-display text-title text-ink'>{title}</h1>
                            {description && <p className='text-sm text-ink-subtle'>{description}</p>}
                        </header>
                        {children}
                    </div>
                    {footer && <div className='mt-6 text-center text-sm text-ink-subtle'>{footer}</div>}
                </div>
            </main>
        </div>
    );
}

/** Divider "or" between the form and the alternative accesses. */
export function AuthDivider() {
    return (
        <div className='my-6 flex items-center gap-3'>
            <span className='h-px flex-1 bg-line'></span>
            <span className='label text-ink-faint'>or</span>
            <span className='h-px flex-1 bg-line'></span>
        </div>
    );
}

function Showcase() {
    return (
        <aside className='relative hidden overflow-hidden border-r border-line bg-surface-sunken lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16'>
            {/* Light from above */}
            <div
                aria-hidden='true'
                className='pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_28rem_at_70%_20%,rgb(149_102_255/0.18),transparent_70%),radial-gradient(36rem_24rem_at_20%_90%,rgb(31_198_245/0.14),transparent_70%)]'
            ></div>
            <div
                aria-hidden='true'
                className='pointer-events-none absolute inset-0 [background-image:linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] [background-size:48px_48px] opacity-25 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]'
            ></div>

            <Logo className='relative' />

            <div className='relative flex items-center gap-10 xl:gap-16'>
                <div className='max-w-md space-y-8'>
                    <div className='space-y-3'>
                        <p className='label text-primary'>Your companion for every duel</p>
                        <h2 className='font-display text-display text-ink'>
                            Build. Practice.
                            <br />
                            <span className='bg-gradient-to-r from-aether-300 via-arcane-300 to-relic-300 bg-clip-text text-transparent'>
                                Ascend.
                            </span>
                        </h2>
                    </div>
                    <ul className='space-y-4'>
                        {FEATURES.map((feature) => (
                            <li key={feature.title} className='flex gap-3'>
                                <span
                                    className={
                                        feature.accent
                                            ? 'grid size-9 shrink-0 place-items-center rounded-control border border-relic-800 bg-relic-950 text-accent'
                                            : 'grid size-9 shrink-0 place-items-center rounded-control border border-aether-900 bg-aether-950 text-primary'
                                    }
                                >
                                    <feature.icon className='size-4' />
                                </span>
                                <div>
                                    <p className='font-display text-sm font-semibold text-ink'>{feature.title}</p>
                                    <p className='text-sm text-ink-subtle'>{feature.text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <CardFan />
            </div>

            <span></span>
        </aside>
    );
}

/** Three face-down cards in a fan, drawn with CSS only. */
function CardFan() {
    const back =
        'absolute inset-0 grid place-items-center rounded-card border border-white/10 shadow-overlay ' +
        'bg-[radial-gradient(circle_at_50%_45%,var(--color-arcane-700),var(--color-night-900)_70%)]';
    return (
        <div aria-hidden='true' className='relative hidden aspect-card w-card-xl shrink-0 xl:block'>
            <div className={`${back} -translate-x-10 -rotate-12 opacity-70`}></div>
            <div className={`${back} translate-x-10 rotate-12 opacity-70`}></div>
            <div className={`${back} shadow-glow-secondary`}>
                <div className='absolute inset-2 rounded-[2px] border border-relic-500/40'></div>
                <div className='absolute inset-3.5 rounded-full border border-aether-400/20'></div>
                <LogoMark className='size-20 drop-shadow-[0_0_18px_rgb(31_198_245/0.6)]' />
            </div>
        </div>
    );
}
