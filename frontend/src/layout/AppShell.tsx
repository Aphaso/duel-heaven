import { useEffect, useRef, useState, type ComponentType, type SVGProps } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { useAuth } from '../auth/useAuth';
import { SupportChat } from '../SupportChat';
import { Logo } from '../ui/Logo';
import {
    BoltIcon,
    CardsIcon,
    ChevronDownIcon,
    DeckIcon,
    LibraryIcon,
    LogoutIcon,
    PlaylistIcon,
    ShieldIcon,
    StoreIcon,
    UserIcon,
    WalletIcon,
} from '../ui/icons';
import { cn } from '../ui/styles';

interface NavItem {
    to: string;
    label: string;
    /** Shorter label for the mobile tab bar. */
    short?: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    end?: boolean;
}

/** Main sections: top bar on desktop, tab bar on mobile. */
const PRIMARY_NAV: NavItem[] = [
    { to: '/cards', label: 'Cards', icon: CardsIcon },
    { to: '/decks', label: 'Decks', icon: DeckIcon },
    { to: '/wth', label: 'WTH?', icon: ShieldIcon },
    { to: '/combos', label: 'Combos', icon: BoltIcon },
    { to: '/playlists', label: 'Playlists', short: 'Lists', icon: PlaylistIcon },
    { to: '/store', label: 'Store', icon: StoreIcon },
];

/** Personal sections: account menu. */
const ACCOUNT_NAV: NavItem[] = [
    { to: '/account', label: 'Account', icon: UserIcon, end: true },
    { to: '/purchases', label: 'Purchased', icon: LibraryIcon },
    { to: '/account/payments', label: 'Payments', icon: WalletIcon },
];

/** Bar on top + point where the page chosen by the router is shown. */
export function AppShell() {
    return (
        <div className='flex min-h-dvh flex-col'>
            <TopBar />
            <div className='flex-1 pb-20 lg:pb-0'>
                <Outlet></Outlet>
            </div>
            <TabBar />
            <SupportChat></SupportChat>
        </div>
    );
}

function TopBar() {
    return (
        <header className='sticky top-0 z-40 border-b border-line bg-surface-base/80 backdrop-blur-md'>
            <div className='mx-auto flex h-topbar max-w-page items-center gap-6 px-gutter lg:px-gutter-lg'>
                <Link to='/cards' aria-label='Duel Heaven, home' className='focus-ring rounded-control'>
                    <Logo />
                </Link>

                <nav aria-label='Main' className='hidden h-full items-stretch gap-1 lg:flex'>
                    {PRIMARY_NAV.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                cn(
                                    'focus-ring group relative flex items-center gap-2 px-3 font-display text-sm font-semibold tracking-wide transition-colors',
                                    isActive ? 'text-ink' : 'text-ink-subtle hover:text-ink',
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={cn('size-4', isActive ? 'text-primary' : 'text-ink-faint group-hover:text-ink-subtle')} />
                                    {item.label}
                                    <span
                                        aria-hidden='true'
                                        className={cn(
                                            'absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-opacity',
                                            item.to === '/store' ? 'bg-accent shadow-glow-accent' : 'bg-primary shadow-glow-primary',
                                            isActive ? 'opacity-100' : 'opacity-0',
                                        )}
                                    ></span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className='ml-auto'>
                    <AccountMenu />
                </div>
            </div>
        </header>
    );
}

function TabBar() {
    return (
        <nav
            aria-label='Main'
            className='fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-base/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden'
        >
            <ul className='mx-auto grid max-w-xl grid-cols-6'>
                {PRIMARY_NAV.map((item) => (
                    <li key={item.to}>
                        <NavLink
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                cn(
                                    'focus-ring flex h-16 flex-col items-center justify-center gap-1 font-display text-micro font-semibold tracking-wide uppercase transition-colors',
                                    isActive ? (item.to === '/store' ? 'text-accent' : 'text-primary') : 'text-ink-subtle hover:text-ink',
                                )
                            }
                        >
                            <item.icon className='size-5' />
                            {item.short ?? item.label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

function AccountMenu() {
    const { user, signOut } = useAuth();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    // Closes the menu on click outside or Escape
    useEffect(() => {
        if (!open) {
            return;
        }
        function onPointer(e: PointerEvent) {
            if (!rootRef.current?.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setOpen(false);
            }
        }
        document.addEventListener('pointerdown', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const handle = user?.username ? `@${user.username}` : user?.email;
    const initial = (user?.displayName ?? user?.username ?? user?.email ?? '?').charAt(0).toUpperCase();

    return (
        <div ref={rootRef} className='relative'>
            <button
                type='button'
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup='menu'
                title={user?.displayName ?? undefined}
                className='focus-ring flex items-center gap-2 rounded-full border border-line bg-surface-raised py-1 pr-2 pl-1 transition-colors hover:border-line-strong hover:bg-surface-hover'
            >
                <span className='grid size-7 place-items-center rounded-full bg-gradient-to-br from-aether-500 to-arcane-500 font-display text-sm font-bold text-ink'>
                    {initial}
                </span>
                <span className='hidden max-w-40 truncate text-sm text-ink-muted sm:block'>{handle}</span>
                <ChevronDownIcon className={cn('size-4 text-ink-subtle transition-transform', open && 'rotate-180')} />
            </button>

            {open && (
                <div
                    role='menu'
                    className='absolute right-0 mt-2 w-60 origin-top-right animate-rise-in overflow-hidden rounded-panel border border-line bg-surface-overlay p-1.5 shadow-overlay'
                >
                    <div className='px-3 py-2'>
                        {user?.displayName && <p className='truncate text-sm font-semibold text-ink'>{user.displayName}</p>}
                        <p className='truncate text-caption text-ink-subtle'>{handle}</p>
                    </div>
                    <div className='my-1 h-px bg-line'></div>
                    {ACCOUNT_NAV.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            role='menuitem'
                            onClick={() => setOpen(false)}
                            className={({ isActive }) =>
                                cn(
                                    'focus-ring flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors',
                                    isActive ? 'bg-aether-950 text-primary' : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
                                )
                            }
                        >
                            <item.icon className='size-4' />
                            {item.label}
                        </NavLink>
                    ))}
                    <div className='my-1 h-px bg-line'></div>
                    <button
                        type='button'
                        role='menuitem'
                        onClick={() => void signOut()}
                        className='focus-ring flex w-full items-center gap-3 rounded-control px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10'
                    >
                        <LogoutIcon className='size-4' />
                        Log out
                    </button>
                </div>
            )}
        </div>
    );
}
