import { jsonBody, request } from '../api';

export type AuthUser = {
    id: string;
    email: string | null;
    username: string | null;
    displayName: string | null;
};

export type AuthResult = { user: AuthUser };

export type RegisterInput = {
    email: string;
    password: string;
    username: string;
    displayName: string;
};

export type GoogleLoginResult =
    | { status: 'authenticated'; user: AuthUser }
    | { status: 'signup'; signupToken: string; name: string; email: string };

export const register = (data: RegisterInput) =>
    request<AuthResult>('/api/auth/register', jsonBody('POST', data));

export const login = (data: { email: string; password: string }) =>
    request<AuthResult>('/api/auth/login', jsonBody('POST', data));

export const logout = () => request<void>('/api/auth/logout', { method: 'POST' });

/** null = no valid session. For this call, 401 is a normal response, not an error. */
export async function fetchMe(): Promise<AuthUser | null> {
    const res = await fetch('/api/auth/me');
    if (res.status === 401) return null;
    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    return (await res.json()) as AuthUser;
}

export const checkUsername = (username: string) =>
    request<{ available: boolean }>(`/api/auth/username-available?username=${encodeURIComponent(username)}`,);

export const googleLogin = (credential: string) =>
    request<GoogleLoginResult>('/api/auth/google', jsonBody('POST', { credential }));

export const googleComplete = (data: { signupToken: string; username: string }) =>
    request<AuthResult>('/api/auth/googl/complete', jsonBody('POST', data));