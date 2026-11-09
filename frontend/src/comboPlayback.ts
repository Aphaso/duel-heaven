import { cardIdOf, replay, type Board, type CardState, type ComboStep, type StepKind, type Zone } from './comboEngine';
import type { Card, Combo } from './types';

export interface Playback {
    /** boards[0] = start, boards[i + 1] = after step i. Empty if the combo cannot be replayed. */
    boards: Board[];
    steps: ComboStep[];
    errors: string[];
    /** The cards of the combo decklist, by card id. */
    cards: Map<number, Card>;
}

/** Replays the whole combo in the browser (same engine as the backend). */
export function buildPlayback(combo: Combo): Playback {
    const cards = new Map<number, Card>(combo.cards.map((row) => [row.cardId, row.card]));
    const entries = combo.cards.map((row) => ({
        cardId: row.cardId,
        section: row.section,
        quantity: row.quantity,
    }));
    const rawSteps = Array.isArray(combo.steps) ? (combo.steps as unknown[]) : [];
    const result = replay(entries, combo.startingHand, rawSteps);
    return { boards: result.boards, steps: result.steps, errors: result.errors, cards };
}

/** The cards of a board grouped by zone, in order of arrival. */
export function cardsByZone(board: Board): Partial<Record<Zone, CardState[]>> {
    const groups: Partial<Record<Zone, CardState[]>> = {};
    for (const card of board) {
        (groups[card.zone] ??= []).push(card);
    }
    return groups;
}

/** The materials attached to a monster. */
export function materialsOf(board: Board, hostId: string): CardState[] {
    return board.filter((c) => c.host === hostId);
}

/** The cards that are new or different from the previous board: they get highlighted. */
export function changedInstances(prev: Board | undefined, next: Board): Set<string> {
    const changed = new Set<string>();
    if (!prev) {
        return changed;
    }
    const before = new Map(prev.map((c) => [c.id, c]));
    for (const c of next) {
        const old = before.get(c.id);
        if (
            !old ||
            old.zone !== c.zone ||
            old.face !== c.face ||
            old.position !== c.position ||
            old.host !== c.host
        ) {
            changed.add(c.id);
        }
    }
    return changed;
}

export const KIND_LABEL: Record<StepKind, string> = {
    NORMAL_SUMMON: 'Normal Summon',
    SET: 'Set',
    SPECIAL_SUMMON: 'Special Summon',
    ACTIVATE_CARD: 'Activate card',
    ACTIVATE_EFFECT: 'Activate effect',
    TRIGGER_EFFECT: 'Trigger effect',
    OTHER: 'Other',
};

export function cardOfInstance(instance: string, cards: Map<number, Card>): Card | undefined {
    const id = cardIdOf(instance);
    return id === null ? undefined : cards.get(id);
}

/** "Activate effect: Ash Blossom" (or just the kind if the step has no source card). */
export function stepTitle(step: ComboStep, cards: Map<number, Card>): string {
    const source = step.source ? cardOfInstance(step.source, cards) : undefined;
    return source ? `${KIND_LABEL[step.kind]}: ${source.name}` : KIND_LABEL[step.kind];
}