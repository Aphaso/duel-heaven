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

const EXTRA_DECK_FRAMES = new Set([
    'fusion',
    'synchro',
    'xyz',
    'link',
    'fusion_pendulum',
    'synchro_pendulum',
    'xyz_pendulum',
]);

export interface CardInfo {
    name: string;
    frameType: string | null;
}

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
   Also prevents the user from putting Extra Deck monsters in the Main Deck and Main Deck cards in the Extra Deck.
*/
export function checkChange(
    entries: DeckEntry[],
    change: DeckEntry,
    card: CardInfo,
): string[] {
    const errors: string[] = [];

    // Doesn't block if it doesn't know the card frameType
    if (card.frameType !== null) {
        const isExtraDeckCard = EXTRA_DECK_FRAMES.has(card.frameType);
        if (change.section === 'EXTRA' && !isExtraDeckCard) {
            errors.push(`${card.name} is not an Extra Deck Monster Card.`);
        }
        if (change.section === 'MAIN' && isExtraDeckCard) {
            errors.push(`${card.name} is an Extra Deck Monster`);
        }
    }

    const others = entries.filter(
        (e) => !(e.cardId === change.cardId && e.section === change.section),
    );
    const next = [...others, change];

    const counts = countBySection(next);
    const max = SECTION_MAX[change.section];
    if (counts[change.section] > max) {
        errors.push(`${SECTION_LABEL[change.section]}: maximum ${max} cards.`);
    }

    const copies = next.filter((e) => e.cardId === change.cardId).reduce((sum, e) => sum + e.quantity, 0);
    if (copies > DECK_RULES.maxCopies) {
        errors.push(`${card.name}: maximum ${DECK_RULES.maxCopies} total copies between Main Deck, Extra Deck and Side Deck.`);
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