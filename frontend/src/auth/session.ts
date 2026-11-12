/** Event for when the server responds with 401 to a request for which we were expecting a valid session */
export const AUTH_EXPIRED_EVENT = 'auth:expired';

/** Header requested by the backend for the requests that want to modify data (CRSF protection) */
export const CSRF_HEADER_NAME = 'X-Requested-With';
export const CSRF_HEADER_VALUE = 'duel-heaven';