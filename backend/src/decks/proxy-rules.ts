export interface DeckCopies {
    cardId: number;
    quantity: number;
}

export interface ProxyRow {
    cardId: number;
    quantity: number;
}

/** Since a card can be in more than one section (Main and Side/Extra and Side), its copies are added up */
export function copiesByCard(entries: DeckCopies[]): Map<number, number> {
    const total = new Map<number, number>();
    for (const e of entries) {
        total.set(e.cardId, (total.get(e.cardId) ?? 0) + e.quantity);
    }
    return total;
}

/** Why a proxy request is not valid: only cards of the deck, and not more copies than it has */
export function checkProxyRows(rows: ProxyRow[], inDeck: Map<number, number>): string[] {
    const errors: string[] = [];
    for (const row of rows) {
        const have = inDeck.get(row.cardId);
        if (have === undefined) {
            errors.push(`Card ${row.cardId} is not in the Deck`);
        } else if (row.quantity > have) {
            errors.push(`Card ${row.cardId}: ${row.quantity} copies requested, the Deck has ${have}`);
        }
    }
    return errors;
}