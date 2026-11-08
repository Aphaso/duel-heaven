export interface WthEntryInput {
    targetCardId: number;
    responses: { cardId: number }[];
}

export const WTH_LIMITS = { maxEntries: 100, maxResponses: 10 } as const;

/**
 * Blocking rules for a WTH guide. Returns a list of messages (empty = valid).
 * `names` maps a card id to its name, only to write readable messages.
 */
export function checkWthEntries(
    entries: WthEntryInput[],
    names: Map<number, string>,
): string[] {
    const label = (id: number) => names.get(id) ?? `#${id}`;
    const errors: string[] = [];

    if (entries.length === 0) {
        errors.push('The guide must have at least one opponent card');
    }

    const seenTargets = new Set<number>();
    for (const entry of entries) {
        const target = label(entry.targetCardId);
        if (seenTargets.has(entry.targetCardId)) {
            errors.push(`${target}: this card appears more than once`);
        }
        seenTargets.add(entry.targetCardId);

        if (entry.responses.length === 0) {
            errors.push(`${target}: must have at least one card in response`);
        }
        const seenResponses = new Set<number>();
        for (const r of entry.responses) {
            if (seenResponses.has(r.cardId)) {
                errors.push(`${target}: ${label(r.cardId)} repeated between responses`);
            }
            seenResponses.add(r.cardId);
        }
    }
    return errors;
}