import { useEffect } from 'react';
import { useBlocker } from 'react-router';

const MESSAGE = 'You have unsaved changes. Discard chagnes and leave?';

/** 
 * Guard against losing unsaved work.
 * Call once per page since React Router supports a single blocker at a time
 */
export function useUnsavedChangesGuard(dirty: boolean) {
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
        if (blocker.state !== 'blocked') {
            return;
        }
        if (window.confirm(MESSAGE)) {
            blocker.proceed();
        } else {
            blocker.reset();
        }
    }, [blocker]);
}