import type { CookieOptions, Response } from "express";

export const SESSION_COOKIE = 'session';

// Same duration as the JWT (7 days): the cookie must not outlive the token it contains
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function baseOptions(): CookieOptions {
    return {
        httpOnly: true, // JavaScript can't read it
        sameSite: 'lax', // Does not get sent in data-modifying requests that are sent by other sites
        secure: process.env.NODE_ENV === 'production', // Only HTTPS in production (HTTP locally)
        path: '/',
    };
}

export function setSessionCookie(res: Response, token: string): void {
    res.cookie(SESSION_COOKIE, token, { ...baseOptions(), maxAge: MAX_AGE_MS });
}

export function clearSessionCookie(res: Response): void {
    // To delete a cookie the options (path, sameSite, secure) must be equal to the ones used to create it
    res.clearCookie(SESSION_COOKIE, baseOptions());
}