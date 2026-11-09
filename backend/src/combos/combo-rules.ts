import { isExtraDeckFrame } from '../decks/deck-rules';
import type { ComboCardEntry } from './combo-engine';

/**
 * A combo decklist is NOT a legal deck: no minimum size, no Side deck, no banlist.
 * Only the limits that keep the board sensible.
 */
export const COMBO_DECK_LIMITS = { mainMax: 60, extraMax: 15, maxCopies: 3 } as const;

export interface ComboCardInfo {
    id: number;
    name: string;
    frameType: string | null;
}

/** Blocking rules for the decklist of a combo. Returns messages (empty = valid). */
export function checkComboCards(
    entries: ComboCardEntry[],
    cards: Map<number, ComboCardInfo>,
): string[] {
    const errors: string[] = [];
    const label = (id: number) => cards.get(id)?.name ?? `#${id}`;

    if (entries.length === 0) {
        errors.push('A Combo must have at least one Card');
    }

    const seen = new Set<string>();
    const copies = new Map<number, number>();
    const totals = { MAIN: 0, EXTRA: 0 };
    for (const e of entries) {
        const key = `${e.section}:${e.cardId}`;
        if (seen.has(key)) {
            errors.push(`${label(e.cardId)}: appears twice in the same Section`);
        }
        seen.add(key);

        if (!Number.isInteger(e.quantity) || e.quantity < 1) {
            errors.push(`${label(e.cardId)}: Invalid Quantity`);
            continue;
        }
        copies.set(e.cardId, (copies.get(e.cardId) ?? 0) + e.quantity);
        totals[e.section] += e.quantity;

        const info = cards.get(e.cardId);
        if (info) {
            const extraCard = isExtraDeckFrame(info.frameType);
            if (extraCard && e.section === 'MAIN') {
                errors.push(`${info.name}: Extra Deck Monster can't be in the Main Deck`);
            }
            if (!extraCard && e.section === 'EXTRA') {
                errors.push(`${info.name}: Only Fusion, Synchro, Xyz and Link Monsters are allowed in the Extra Deck`);
            }
        }
    }
    for (const [cardId, n] of copies) {
        if (n > COMBO_DECK_LIMITS.maxCopies) {
            errors.push(`${label(cardId)}: ${COMBO_DECK_LIMITS.maxCopies} copies maximum`);
        }
    }
    if (totals.MAIN > COMBO_DECK_LIMITS.mainMax) {
        errors.push(`Main Deck: ${COMBO_DECK_LIMITS.mainMax} cards maximum (${totals.MAIN} right now)`);
    }
    if (totals.EXTRA > COMBO_DECK_LIMITS.extraMax) {
        errors.push(`Extra Deck: ${COMBO_DECK_LIMITS.extraMax} cards maximum (${totals.EXTRA} right now)`);
    }
    return errors;
}