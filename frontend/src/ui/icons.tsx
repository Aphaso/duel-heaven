import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/** Base for 24×24 line icons: they take the color from the text. */
function Icon({ children, className = 'size-5', ...rest }: IconProps & { children: ReactNode }) {
    return (
        <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={1.75}
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'
            className={className}
            {...rest}
        >
            {children}
        </svg>
    );
}

export const CardsIcon = (p: IconProps) => (
    <Icon {...p}>
        <rect x='7' y='3' width='12' height='16' rx='1.5' />
        <path d='M5 6.5v12A1.5 1.5 0 0 0 6.5 20H15' />
        <circle cx='13' cy='11' r='2.5' />
    </Icon>
);

export const DeckIcon = (p: IconProps) => (
    <Icon {...p}>
        <rect x='4' y='8' width='16' height='12' rx='1.5' />
        <path d='M6 5h12M8 2h8' />
    </Icon>
);

export const ShieldIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d='M12 3 4.5 6v5.5c0 4.5 3.2 8.2 7.5 9.5 4.3-1.3 7.5-5 7.5-9.5V6L12 3Z' />
        <path d='M12 8v4M12 15.5v.5' />
    </Icon>
);

export const BoltIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d='M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z' />
    </Icon>
);

export const PlaylistIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d='M4 6h11M4 11h11M4 16h7' />
        <path d='m15 14 5 3-5 3v-6Z' />
    </Icon>
);

export const StoreIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d='M4 9.5 5.5 4h13L20 9.5' />
        <path d='M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0' />
        <path d='M5.5 12.5V20h13v-7.5M10 20v-4.5h4V20' />
    </Icon>
);

export const LibraryIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d='M6 4h12v17l-6-4-6 4V4Z' />
    </Icon>
);

export const WalletIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d='M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3' />
        <rect x='4' y='8' width='16' height='11' rx='2' />
        <path d='M16 13.5h.5' />
    </Icon>
);

export const UserIcon = (p: IconProps) => (
    <Icon {...p}>
        <circle cx='12' cy='8' r='4' />
        <path d='M4.5 20.5a7.5 7.5 0 0 1 15 0' />
    </Icon>
);

export const LogoutIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d='M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10' />
    </Icon>
);

export const ChatIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d='M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12Z' />
        <path d='M9.5 10a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.6-.8 1.1M12 16.5v.01' />
    </Icon>
);

export const SendIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d='M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z' />
    </Icon>
);

export const CloseIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d='M6 6l12 12M18 6 6 18' />
    </Icon>
);

export const ChevronLeftIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d='m15 6-6 6 6 6' />
    </Icon>
);

export const ChevronRightIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d='m9 6 6 6-6 6' />
    </Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d='m6 9 6 6 6-6' />
    </Icon>
);

export const AlertIcon = (p: IconProps) => (
    <Icon {...p}>
        <path d='M12 3 2.5 20h19L12 3Z' />
        <path d='M12 10v4M12 17v.01' />
    </Icon>
);
