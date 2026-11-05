import type { Card, DeckSection } from '../generated/prisma/client';

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

export function isExtraDeckFrame(frameType: string | null): boolean {
    return frameType !== null && EXTRA_DECK_FRAMES.has(frameType);
}

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

/* Save blocking checks: duplicated entries, Extra Deck monsters in Main and Main cards in Extra,
   section limit and copy limit.
   Returns list of problems (if it's empty the deck list is valid).
*/
export function checkDeckList(
    entries: DeckEntry[],
    cards: Map<number, CardInfo>,
): string[] {
    const errors: string[] = [];
    const nameOf = (id: number) => cards.get(id)?.name ?? `Card ${id}`;

    const seen = new Set<string>();
    const copies = new Map<number, number>();

    for (const e of entries) {
        const key = `${e.cardId}:${e.section}`;
        if (seen.has(key)) {
            errors.push(`${nameOf(e.cardId)}: appears multiple times in the ${SECTION_LABEL[e.section]}`);
        }
        seen.add(key);
        copies.set(e.cardId, (copies.get(e.cardId) ?? 0) + e.quantity);

        // Doesn't block if it doesn't know the card's frameType
        const frameType = cards.get(e.cardId)?.frameType ?? null;
        if (frameType !== null) {
            const isExtraDeckCard = EXTRA_DECK_FRAMES.has(frameType);
            if (e.section === 'EXTRA' && !isExtraDeckCard) {
                errors.push(`${nameOf(e.cardId)}: is not an Extra Deck Monster`);
            }
            if (e.section === 'MAIN' && isExtraDeckCard){
                errors.push(`${nameOf(e.cardId)}: is not a Main Deck Card`);
            }
        }
    }

    const counts = countBySection(entries);
    for (const section of ['MAIN', 'EXTRA', 'SIDE'] as const) {
        if (counts[section] > SECTION_MAX[section]) {
            errors.push(`${SECTION_LABEL[section]}: ${SECTION_MAX[section]} cards maximum`);
        }
    }

    for (const [cardId, total] of copies) {
        if (total > DECK_RULES.maxCopies) {
            errors.push(`${nameOf(cardId)}: ${DECK_RULES.maxCopies} copies maximum between Main Deck, Extra Deck and Side Deck`);
        }
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