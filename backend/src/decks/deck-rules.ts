import type { DeckSection } from '../generated/prisma/client';

export const DECK_RULES = {
    mainMin: 40,
    mainMax: 60,
    extraMax: 15,
    sideMax: 15,
    maxCopies: 3,
} as const;

export interface DeckEntry {
    cardId: number;
    section: DeckSection;
    quantity: number;
}

const SECTION_MAX: Record<DeckSection, number> = {
    MAIN: DECK_RULES.mainMax,
    EXTRA: DECK_RULES.extraMax,
    SIDE: DECK_RULES.sideMax,
};

const SECTION_LABEL: Record<DeckSection, string> = {
    MAIN: 'Main Deck',
    EXTRA: 'Extra Deck',
    SIDE: 'Side Deck',
};

function countBySection(entries: DeckEntry[]): Record<DeckSection, number> {
    const counts: Record<DeckSection, number> = { MAIN: 0, EXTRA: 0, SIDE: 0 };
    for (const e of entries) {
        counts[e.section] += e.quantity;
    }
    return counts;
}

/* Controls on modification, limiting the max number of copies and the max number for each section.
   Verifies the state that would result by applying `change` to the deck.
   Only check the target section and card, since the rest is already valid.
*/
export function checkChange(
    entries: DeckEntry[],
    change: DeckEntry,
    cardName: string,
): string[] {
    const others = entries.filter(
        (e) => !(e.cardId === change.cardId && e.section === change.section),
    );
    const next = [...others, change];
    const errors: string[] = [];

    const counts = countBySection(next);
    const max = SECTION_MAX[change.section];
    if (counts[change.section] > max) {
        errors.push(`${SECTION_LABEL[change.section]}: max ${max} cards (with this change the number would be ${counts[change.section]})`,);
    }

    const copies = next.filter((e) => e.cardId === change.cardId).reduce((sum, e) => sum + e.quantity, 0);
    if (copies > DECK_RULES.maxCopies) {
        errors.push(`${cardName}: max ${DECK_RULES.maxCopies} total copies between Main Deck, Extra Deck and Side Deck (with this change the number would be ${copies})`,);
    }

    return errors;
}

// Deck state: doesn't block anything, its only purpose is showing if the deck is complete or incomplete
export function analyzeDeck(entries: DeckEntry[]) {
    const counts = countBySection(entries);
    const issues: string[] = [];
    if (counts.MAIN < DECK_RULES.mainMin) {
        issues.push(`Incomplete Main Deck: ${counts.MAIN}/${DECK_RULES.mainMin} cards`,);
    }
    return {
        counts,
        limits: DECK_RULES,
        complete: issues.length === 0,
        issues,
    };
}