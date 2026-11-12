/** The token of an "Authorization: Bearer <token>" header, or null if the header is not that. */
export function bearerToken(header: string | undefined): string | null {
    if (!header) {
        return null;
    }
    const [scheme, token, ...rest] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token || rest.length > 0) {
        return null;
    }
    return token;
}

/** Emails are compared in lowercase, so "Mario@X.it" and "mario@x.it" are the same account. */
export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export const USERNAME_RULES = { min: 3, max: 20 } as const;

const RESERVED_USERNAMES = new Set([
    'admin', 'administrator', 'root', 'support', 'system', 'moderator', 'staff', 'help',
    'me', 'api', 'null', 'undefined', 'demo', 'demo_user',
]);

/** Usernames are stored in lowercase: "Mario_92" and "mario_92" are the same name. */
export function normalizeUsername(username: string): string {
    return username.trim().toLowerCase();
}

/** Why a username cannot be used, or null if it is fine. */
export function usernameProblem(raw: string): string | null {
    const username = normalizeUsername(raw);
    if (username.length < USERNAME_RULES.min || username.length > USERNAME_RULES.max) {
        return `The username must have between ${USERNAME_RULES.min} and ${USERNAME_RULES.max} characters`;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
        return 'The username can only contain letters, numbers and underscores (_)';
    }
    if (RESERVED_USERNAMES.has(username)) {
        return 'This username is not available';
    }
    return null;
}