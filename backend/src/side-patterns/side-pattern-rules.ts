import { isExtraDeckFrame, type CardInfo, type DeckEntry } from '../decks/deck-rules';

/**
 * A side pattern has two independent "lines" to balance:
 * - MAIN: switch out cards from the Main Deck and switch in cards from the Side Deck.
 * - EXTRA: switch out Extra Deck monsters and switch in other Extra Deck Monsters from the Side Deck.
 */
export type Lane = 'MAIN' | 'EXTRA';

export interface PatternCard {
    cardId: number;
    quantity: number;
}

const LANE_LABEL: Record<Lane, string> = {
    MAIN: 'Main Deck',
    EXTRA: 'Extra Deck',
};

const LANE_IN: Record<Lane, string> = {
    MAIN: 'the Main Deck',
    EXTRA: 'the Extra Deck',
};

/**
 * In which lane does a card move?
 */
export function laneOf(card: CardInfo | undefined): Lane {
    return card !== undefined && isExtraDeckFrame(card.frameType)
        ? 'EXTRA'
        : 'MAIN';
}

/**
 * Checks a side pattern
 */
export function checkSidePattern(
    cardsOut: PatternCard[],
    cardsIn: PatternCard[],
    deckEntries: DeckEntry[],
    cards: Map<number, CardInfo>,
): string[] {
    const errors: string[] = [];
    const nameOf = (id: number) => cards.get(id)?.name ?? `Card ${id}`;
    const copies = (cardId: number, section: 'MAIN' | 'EXTRA' | 'SIDE') =>
        deckEntries.filter((e) => e.cardId === cardId && e.section === section).reduce((sum, e) => sum + e.quantity, 0);

    // No duplicated card in the same list
    const lists = [
        { label: 'sided out', list: cardsOut },
        { label: 'sided in', list: cardsIn },
    ];
    for (const { label, list } of lists) {
        const seen = new Set<number>();
        for (const c of list) {
            if (seen.has(c.cardId)) {
                errors.push(`${nameOf(c.cardId)}: appears more than once between the cards that are ${label}`);
            }
            seen.add(c.cardId);
        }
    }

    // No card can be sided in and out at the same time
    const outIds = new Set(cardsOut.map((c) => c.cardId));
    for (const c of cardsIn) {
        if (outIds.has(c.cardId)) {
            errors.push(`${nameOf(c.cardId)}: can't be sided both in and out at the same time`);
        }
    }

    const totals = {
        MAIN: { out: 0, in: 0 },
        EXTRA: { out: 0, in: 0 },
    };

    for (const c of cardsOut) {
        const lane = laneOf(cards.get(c.cardId));
        const available = copies(c.cardId, lane);
        if (available === 0) {
            errors.push(`${nameOf(c.cardId)}: not in ${LANE_IN[lane]}, so it can't be sided out`);
        } else if (c.quantity > available) {
            errors.push(`${nameOf(c.cardId)}: trying to side out ${c.quantity} but ${LANE_IN[lane]} has ${available} available`);
        }
        totals[lane].out += c.quantity;
    }

    for (const c of cardsIn) {
        const lane = laneOf(cards.get(c.cardId));
        const available = copies(c.cardId, 'SIDE');
        if (available === 0) {
            errors.push(`${nameOf(c.cardId)}: not in Side Deck, so it can't be sided in`);
        } else if (c.quantity > available) {
            errors.push(`${nameOf(c.cardId)}: trying to side in ${c.quantity} but the Side Deck has ${available} available`);
        }
        totals[lane].in += c.quantity;
    }

    // Balance each lane
    for (const lane of ['MAIN', 'EXTRA'] as const) {
        const t = totals[lane];
        if (t.out !== t.in) {
            errors.push(`${LANE_LABEL[lane]}: siding out ${t.out} cards but only siding in ${t.in}`);
        }
    }

    return errors;
}