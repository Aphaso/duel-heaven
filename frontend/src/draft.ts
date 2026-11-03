import { isExtraDeckCard } from './deckRules';
import type { Card, DeckCardEntry, DeckSection } from './types';

/** Single draft entry: one card, in a section, with its quantity */
export interface DraftEntry {
    card: Card;
    section: DeckSection;
    quantity: number;
}

/** Card (entry) category */
export type Category = 'monster' | 'spell' | 'trap' | 'extra';

/** Order inside a Section (Extra Deck Monsters are last in the Side Deck) */
export const CATEGORY_ORDER: Category[] = ['monster', 'spell', 'trap', 'extra'];
export const SECTION_ORDER: DeckSection[] = ['MAIN', 'EXTRA', 'SIDE'];

export const CATEGORY_LABEL: Record<Category, string> = {
    monster: 'Monsters',
    spell: 'Spells',
    trap: 'Traps',
    extra: 'Extra Deck Monsters',
};

/** Unique identifier of an entry: the same card can be in multiple sections */
export function entryKey(e: { card: Card; section: DeckSection }): string {
    return `${e.section}:${e.card.id}`;
}

/** In which part of a section a card must be showed */
export function categoryFor(section: DeckSection, card: Card): Category {
    // The Extra Deck does not have sub-sections, therefore we just use insertion order
    if (section === 'EXTRA') {
        return 'extra';
    }
    let base: Category = 'monster';
    if (card.frameType === 'spell' || card.type === 'Spell Card') {
        base = 'spell';
    } else if (card.frameType === 'trap' || card.type === 'Trap Card') {
        base = 'trap';
    } else if (isExtraDeckCard(card)) {
        base = 'extra';
    }

    // The backend forbids an Extra Deck Monster from entering the Main Deck, but just in case
    // something goes wrong, we show it with the other monsters
    if (section === 'MAIN' && base === 'extra') {
        return 'monster';
    }
    return base;
}

/** Starting draft: copy of the currently saved cards, in the order they reach the backend with */
export function toDraft(entries: DeckCardEntry[]): DraftEntry[] {
    return entries.map((e) => ({
        card: e.card,
        section: e.section,
        quantity: e.quantity,
    }));
}

/** New draft with the set quantity (0 or less = the entry is removed).
 *  A new card goes to the end; an already present one only changes quantity.
 */
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

export interface Block {
    category: Category;
    entries: DraftEntry[];
}

/** The blocks of a section in their respective order.
 *  Inside each block the entries are kept in the draft's order.
 */
export function blocksOf(draft: DraftEntry[], section: DeckSection): Block[] {
    const blocks: Block[] = [];
    for (const category of CATEGORY_ORDER) {
        const entries = draft.filter((e) => e.section === section && categoryFor(e.section, e.card) === category);
        if (entries.length > 0) {
            blocks.push({ category, entries });
        }
    }
    return blocks;
}

/** The draft as the user sees it */
export function normalize(draft: DraftEntry[]): DraftEntry[] {
    return SECTION_ORDER.flatMap((section) => blocksOf(draft, section).flatMap((block) => block.entries));
}

/** Move an entry within the same section and block */
export function moveEntry(
    draft: DraftEntry[],
    fromKey: string,
    toKey: string,
): DraftEntry[] {
    const from = draft.findIndex((e) => entryKey(e) === fromKey);
    const to = draft.findIndex((e) => entryKey(e) === toKey);
    const a = draft[from];
    const b = draft[to];
    if (a === undefined || b === undefined || from === to) {
        return draft;
    }
    if (a.section !== b.section || categoryFor(a.section, a.card) !== categoryFor(b.section, b.card)) {
        return draft;
    }
    const next = [...draft];
    next.splice(from, 1);
    next.splice(to, 0, a);
    return next;
}

/** Do two lists have the same content and order? */
export function isSameList(a: DraftEntry[], b: DraftEntry[]): boolean {
    const na = normalize(a);
    const nb = normalize(b);
    if (na.length !== nb.length) {
        return false;
    }
    return na.every((e, i) => {
        const other = nb[i];
        return (
            other !== undefined &&
            entryKey(e) === entryKey(other) &&
            e.quantity === other.quantity
        );
    });
}