import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ConfirmContext, type ConfirmFn, type ConfirmOptions } from './ConfirmContext';
import { Button } from '../ui/Button';
import { AlertIcon } from '../ui/icons';

interface Request {
    options: ConfirmOptions;
    resolve: (answer: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [request, setRequest] = useState<Request | null>(null);
    // The same request, readable from the functions below without waiting for a new render
    const current = useRef<Request | null>(null);
    const dialogRef = useRef<HTMLDialogElement>(null)

    const confirm = useCallback<ConfirmFn>((options) => {
        return new Promise<boolean>((resolve) => {
            // A new question while another is open: the old one counts as no
            current.current?.resolve(false);
            const next = { options, resolve };
            current.current = next;
            setRequest(next);
        });
    }, []);

    function answer(value: boolean) {
        current.current?.resolve(value);
        current.current = null;
        setRequest(null);
    }

    // The native dialog is opened and closed with methods, not with props: this syncs with the state
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) {
            return;
        }
        if (request && !dialog.open) {
            dialog.showModal();
        }
        if (!request && dialog.open) {
            dialog.close();
        }
    }, [request]);

    const options = request?.options;

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            <dialog
                ref={dialogRef}
                aria-labelledby='confirm-title'
                onCancel={(e) => {
                    e.preventDefault();
                    answer(false);
                }}
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        answer(false);
                    }
                }}
                className='m-auto w-[calc(100%-2rem)] max-w-md animate-rise-in rounded-panel border border-line bg-surface-overlay p-0 text-ink shadow-overlay backdrop:bg-night-950/70 backdrop:backdrop-blur-sm'
            >
                {options && (
                    <div className='space-y-5 p-6'>
                        <div className='flex gap-4'>
                            {options.destructive && (
                                <span className='grid size-10 shrink-0 place-items-center rounded-full bg-danger/15 text-danger'>
                                    <AlertIcon />
                                </span>
                            )}
                            <div className='space-y-2'>
                                <h2 id='confirm-title' className='font-display text-heading text-ink'>
                                    {options.title}
                                </h2>
                                {options.message && (
                                    <p className='whitespace-pre-line text-sm text-ink-muted'>{options.message}</p>
                                )}
                            </div>
                        </div>
                        <div className='flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
                            <Button variant='ghost' onClick={() => answer(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant={options.destructive ? 'danger' : 'primary'}
                                onClick={() => answer(true)}
                                autoFocus
                            >
                                {options.confirmLabel ?? 'Confirm'}
                            </Button>
                        </div>
                    </div>
                )}
            </dialog>
        </ConfirmContext.Provider>
    );
}