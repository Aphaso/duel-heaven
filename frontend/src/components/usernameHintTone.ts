import type { HintTone } from '../ui/Field';

/** Color of the username hint, from the result of useUsernameCheck. */
export function usernameHintTone({
    candidate,
    lengthOk,
    checking,
    available,
}: {
    candidate: string;
    lengthOk: boolean;
    checking: boolean;
    available: boolean;
}): HintTone {
    if (candidate !== '' && !lengthOk) {
        return 'danger';
    }
    if (checking) {
        return 'pending';
    }
    if (available) {
        return 'success';
    }
    return 'neutral';
}
