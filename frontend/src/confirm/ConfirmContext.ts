import { createContext } from 'react';

export interface ConfirmOptions {
    title: string;
    message?: string;
    confirmLabel?: string;
    destructive?: boolean;
}

/* Resolves to true if the user confirms, false if they cancel */
export type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

export const ConfirmContext = createContext<ConfirmFn | null>(null);