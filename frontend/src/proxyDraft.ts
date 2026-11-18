export type ProxySection = 'MAIN' | 'EXTRA' | 'SIDE';

/** What the draft needs to know about a Decklist row (DeckCardEntry has all of it). */
export interface ProxyEntry {
    section: ProxySection;
    cardId: number;
    quantity: number;
}

/** Copies to print, by "SECTION:cardId".
 * It is not the id of the row: saving the Decklist recrates the rows.
 */
export type ProxyDraft = Record<string, number>;

/** Same as the backend layout (3 x 3 on an A4 page) */
export const PROXIES_PER_PAGE = 9;

const SECTION_ORDER: Record<ProxySection, number> = { MAIN: 0, EXTRA: 1, SIDE: 2 };

export function proxyKey(entry: ProxyEntry): string {
    return `${entry.section}:${entry.cardId}`;
}

/** Copies chosen for the row, never more than the Deck has (the Decklist may have changed). */
export function proxyCopies(draft: ProxyDraft, entry: ProxyEntry): number {
    return Math.min(draft[proxyKey(entry)] ?? 0, entry.quantity);
}

export function setProxyCopies(draft: ProxyDraft, entry: ProxyEntry, copies: number): ProxyDraft {
    const wanted = Number.isFinite(copies) ? Math.trunc(copies) : 0;
    const n = Math.max(0, Math.min(wanted, entry.quantity));
    const next = { ...draft };
    if (n === 0) {
        delete next[proxyKey(entry)];
    } else {
        next[proxyKey(entry)] = n;
    }
    return next;
}

export function selectAllProxies(entries: ProxyEntry[]): ProxyDraft {
    const draft: ProxyDraft = {};
    for (const e of entries) {
        if (e.quantity > 0) {
            draft[proxyKey(e)] = e.quantity;
        }
    }
    return draft;
}

export function proxyTotal(draft: ProxyDraft, entries: ProxyEntry[]): number {
    return entries.reduce((sum, e) => sum + proxyCopies(draft, e), 0);
}

export function proxyPages(total: number): number {
    return Math.ceil(total / PROXIES_PER_PAGE);
}

/** What is sent to the backend: one row per card, Main first, then Extra, then Side. */
export function proxyRows(draft: ProxyDraft, entries: ProxyEntry[]): { cardId: number; quantity: number }[] {
    // sort is stable: inside a section the order of the Decklist stays
    const ordered = [...entries].sort((a, b) => SECTION_ORDER[a.section] - SECTION_ORDER[b.section]);
    const byCard = new Map<number, number>();
    for (const e of ordered) {
        const n = proxyCopies(draft, e);
        if (n > 0) {
            byCard.set(e.cardId, (byCard.get(e.cardId) ?? 0) + n);
        }
    }
    return [...byCard].map(([cardId, quantity]) => ({ cardId, quantity }));
}

/** Normalize Proxy filename: letters, numbers and accents are kept, the rest (whitespace included) becomes "-". */
export function proxyFileName(deckName: string): string {
    const safe = deckName
        .normalize('NFC')
        .replace(/[^\p{L}\p{N}]+/gu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60)
        .replace(/-+$/g, '');
    return `${safe || 'deck'}-proxies.pdf`;
}