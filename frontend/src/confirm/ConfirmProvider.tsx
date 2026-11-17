import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ConfirmContext, type ConfirmFn, type ConfirmOptions } from './ConfirmContext';

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
                className='m-auto w-full max-w-md rounded-lg p-0 shadow-xl backdrop:bg-black/40'
            >
                {options && (
                    <div className='space-y-4 p-6'>
                        <h2 id='confirm-title' className='text-lg font-semibold'>
                            {options.title}
                        </h2>
                        {options.message && (
                            <p className='whitespace-pre-line text-sm text-gray-700'>{options.message}</p>
                        )}
                        <div className='flex justify-end gap-2'>
                            <button
                                type='button'
                                onClick={() => answer(false)}
                                className='rounded border border-gray-300 px-4 py-2 hover:bg-gray-50'
                            >
                                Cancel
                            </button>
                            <button
                                type='button'
                                onClick={() => answer(true)}
                                className={`rounded px-4 py-2 text-white ${
                                    options.destructive
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {options.confirmLabel ?? 'Confirm'}
                            </button>
                        </div>
                    </div>
                )}
            </dialog>
        </ConfirmContext.Provider>
    );
}