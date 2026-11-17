import { useContext } from 'react';
import { ConfirmContext, type ConfirmFn } from './ConfirmContext';

export function useConfirm(): ConfirmFn {
    const confirm = useContext(ConfirmContext);
    if (!confirm) {
        throw new Error('useConfirm needs a ConfirmProvider above it');
    }
    return confirm;
}