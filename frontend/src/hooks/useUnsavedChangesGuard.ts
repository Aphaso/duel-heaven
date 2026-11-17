import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router';
import { useConfirm } from '../confirm/useConfirm';

/** 
 * Guard against losing unsaved work.
 * Call once per page since React Router supports a single blocker at a time
 */
export function useUnsavedChangesGuard(dirty: boolean) {
    const confirm = useConfirm();
    // True while dialog is open: the same blocked navigation must not open it twice
    const asking = useRef(false);

    // Closing or reloading the tab
    useEffect(() => {
        if (!dirty) {
            return;
        }
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [dirty]);

    // Navigating to another route inside the app
    const blocker = useBlocker(dirty);
    useEffect(() => {
        if (blocker.state !== 'blocked' || asking.current) {
            return;
        }
        asking.current = true;
        void confirm({
            title: 'Leave this page?',
            message: 'You have unsaved changes. If you leave, they will be lost.',
            confirmLabel: 'Leave',
            destructive: true,
        }).then((leave) => {
            asking.current = false;
            if (leave) {
                blocker.proceed();
            } else {
                blocker.reset();
            }
        });
    }, [blocker, confirm]);
}