export const STORE_PAGE_SIZE = 12;
export const SEARCH_MAX_LENGTH = 50;

export interface StoreQuery {
    q: string;
    page: number;

}

/**
 * Cleans the raw query string parameters (they always arrive as text or are either missing or dirty).
 * It never throws: an invalid parameter becomes the default.
 */
export function normalizeStoreQuery(rawQ: unknown, rawPage: unknown): StoreQuery {
    const q = typeof rawQ === 'string'
        ? rawQ.trim().replace(/\s+/g, ' ').slice(0, SEARCH_MAX_LENGTH).trim()
        : '';

    const parsed = typeof rawPage === 'string' && rawPage.trim() !== ''
        ? Number(rawPage)
        : typeof rawPage === 'number'
            ? rawPage
            : 1;

    const page = Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : 1;

    return { q, page };
}

export function totalPagesFor(total: number, pageSize: number = STORE_PAGE_SIZE): number {
    return Math.max(1, Math.ceil(total / pageSize));
}

/** A page after the last one (e.g. after the last listing disappears) goes back to the last one. */
export function clampPage(page: number, totalPages: number): number {
    return Math.min(Math.max(1, page), totalPages);
}