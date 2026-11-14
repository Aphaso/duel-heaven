import { useQuery } from '@tanstack/react-query';
import { checkUsername } from '../auth/authApi';
import { useDebounce } from './useDebounce';

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

export function useUsernameCheck(username: string) {
    const candidate = username.trim();
    const debounce = useDebounce(candidate, 400);
    const lengthOk = candidate.length >= USERNAME_MIN && candidate.length <= USERNAME_MAX;

    const availability = useQuery({
        queryKey: ['username-available', debounce],
        queryFn: () => checkUsername(debounce),
        enabled: debounce.length >= USERNAME_MIN && debounce.length <= USERNAME_MAX,
        staleTime: 10_000,
    });

    // The result is valid only if it concerns the name currently in the field
    const checking = lengthOk && (debounce !== candidate || availability.isFetching);
    const taken = lengthOk && !checking && availability.data?.available === false;
    const available = lengthOk && !checking && availability.data?.available === true;

    let hint = `${USERNAME_MIN}-${USERNAME_MAX} characters`;
    if (candidate !== '' && !lengthOk) {
        hint = `Must be ${USERNAME_MIN}-${USERNAME_MAX} characters`;
    } else if (checking) {
        hint = 'Checking...'
    } else if (taken) {
        hint = 'Already taken';
    } else if (available) {
        hint = 'Available';
    }

    return { candidate, lengthOk, checking, taken, available, hint };
}