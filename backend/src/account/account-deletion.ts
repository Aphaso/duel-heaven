export interface Identifiable {
    username: string | null;
    email: string | null;
}

/** What the user must type to confirm: the username, or the email if there is no username yet */
export function confirmationTarget(user: Identifiable): string | null {
    return user.username ?? user.email;
}

export function isDeletionConfirmed(input: unknown, user: Identifiable): boolean {
    const target = confirmationTarget(user);
    if (target === null || target.trim() === '' || typeof input !== 'string') {
        return false;
    }
    return input.trim().toLowerCase() === target.trim().toLowerCase();
}