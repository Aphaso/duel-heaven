import type { Card, DeckCardEntry, DeckSection } from './types';

/** Single draft entry: one card, in a section, with its quantity */
export interface DraftEntry {
    card: Card;
    section: DeckSection;
    quantity: number;
}

/** Starting draft: copy of the currently saved cards */
export function toDraft(entries: DeckCardEntry[]): DraftEntry[] {
    return entries.map((e) => ({
        card: e.card,
        section: e.section,
        quantity: e.quantity,
    }));
}

/** New draft with the set quantity (0 or less = the entry is removed) */
export function withQuantity(
    draft: DraftEntry[],
    card: Card,
    section: DeckSection,
    quantity: number,
): DraftEntry[] {
    const matches = (e: DraftEntry) => e.card.id === card.id && e.section === section;

    if (quantity <= 0) {
        return draft.filter((e) => !matches(e));
    }
    if (draft.some(matches)) {
        return draft.map((e) => (matches(e) ? { ...e, quantity } : e));
    }
    return [...draft, { card, section, quantity }];
}

/** Do two lists have the same content, regardless of the order? */
export function isSameList(a: DraftEntry[], b: DraftEntry[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    const key = (e: DraftEntry) => `${e.card.id}:${e.section}:${e.quantity}`;
    const inB = new Set(b.map(key));
    return a.every((e) => inB.has(key(e)));
}