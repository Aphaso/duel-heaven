import type { NextFunction, Request, Response } from "express";

export const CSRF_HEADER = 'x-requested-with';
export const CSRF_VALUE = 'duel-heaven';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const EXEMPT_PATHS = new Set(['/stripe/webhook']);

/**
 * The requests tha want to modify data must have an header that another site can't add.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
    if (SAFE_METHODS.has(req.method) || EXEMPT_PATHS.has(req.path) || req.headers[CSRF_HEADER] === CSRF_VALUE) {
        next();
        return;
    }
    res.status(403).json({
        statusCode: 403,
        error: 'Forbidden',
        message: 'Missing CSRF header',
    });
}