import { isExtraDeckCard } from './deckRules';
import { parseStep, replay, type ComboCardEntry, type ComboStep } from './comboEngine';
import type { Card, Combo, ComboPayload, DeckSection } from './types';

/** Same limits as the backend, but the backend stays the authority. */
export const COMBO_DECK_UI = { mainMax: 60, extraMax: 15, maxCopies: 3, maxHand: 10 } as const;

export interface DraftCard {
    card: Card;
    section: 'MAIN' | 'EXTRA';
    quantity: number;
}

/** A combo being edited: lives only in the browser until the user saves. */
export interface ComboDraft {
    name: string;
    description: string;
    cards: DraftCard[];
    /** Card ids of the starting hand (repeated for more copies). */
    startingHand: number[];
    steps: ComboStep[];
}

export function emptyComboDraft(): ComboDraft {
    return { name: '', description: '', cards: [], startingHand: [], steps: [] };
}

/** Extra Deck monsters go to the Extra Deck, everything else to the Main Deck. */
export function sectionOfCard(card: Card): 'MAIN' | 'EXTRA' {
    return isExtraDeckCard(card) ? 'EXTRA' : 'MAIN';
}

export function draftFromCombo(combo: Combo): ComboDraft {
    const rawSteps = Array.isArray(combo.steps) ? (combo.steps as unknown[]) : [];
    const steps: ComboStep[] = [];
    for (const raw of rawSteps) {
        const parsed = parseStep(raw);
        if (parsed.error === undefined) {
            steps.push(parsed.step);
        }
    }
    return {
        name: combo.name,
        description: combo.description ?? '',
        cards: combo.cards.map((r) => ({ card: r.card, section: r.section, quantity: r.quantity })),
        startingHand: [...combo.startingHand],
        steps,
    };
}

export function copiesOf(draft: ComboDraft, cardId: number): number {
    return draft.cards.find((c) => c.card.id === cardId)?.quantity ?? 0;
}

export function deckCounts(draft: ComboDraft): Record<'MAIN' | 'EXTRA', number> {
    const counts = { MAIN: 0, EXTRA: 0 };
    for (const c of draft.cards) {
        counts[c.section] += c.quantity;
    }
    return counts;
}

/** Can another copy be added? (3 copies per card, and room in its section) */
export function canAddCopy(draft: ComboDraft, card: Card): boolean {
    const section = sectionOfCard(card);
    const limit = section === 'MAIN' ? COMBO_DECK_UI.mainMax : COMBO_DECK_UI.extraMax;
    return (
        copiesOf(draft, card.id) < COMBO_DECK_UI.maxCopies && deckCounts(draft)[section] < limit
    );
}

export function addCopy(draft: ComboDraft, card: Card): ComboDraft {
    if (!canAddCopy(draft, card)) {
        return draft;
    }
    if (draft.cards.some((c) => c.card.id === card.id)) {
        return {
            ...draft,
            cards: draft.cards.map((c) =>
                c.card.id === card.id ? { ...c, quantity: c.quantity + 1 } : c,
            ),
        };
    }
    return {
        ...draft,
        cards: [...draft.cards, { card, section: sectionOfCard(card), quantity: 1 }],
    };
}

export function handCopies(draft: ComboDraft, cardId: number): number {
    return draft.startingHand.filter((id) => id === cardId).length;
}

/** The hand can never hold more copies than the Main Deck has, nor more than maxHand cards. */
export function setHandCopies(draft: ComboDraft, cardId: number, wanted: number): ComboDraft {
    const entry = draft.cards.find((c) => c.card.id === cardId && c.section === 'MAIN');
    const others = draft.startingHand.filter((id) => id !== cardId);
    const room = COMBO_DECK_UI.maxHand - others.length;
    const n = Math.max(0, Math.min(wanted, entry?.quantity ?? 0, room));
    return { ...draft, startingHand: [...others, ...Array<number>(n).fill(cardId)] };
}

/** Removes one copy. The hand is trimmed if it would hold more copies than the deck. */
export function removeCopy(draft: ComboDraft, cardId: number): ComboDraft {
    const cards = draft.cards
        .map((c) => (c.card.id === cardId ? { ...c, quantity: c.quantity - 1 } : c))
        .filter((c) => c.quantity > 0);
    const next = { ...draft, cards };
    const inHand = handCopies(next, cardId);
    const allowed = next.cards.find((c) => c.card.id === cardId && c.section === 'MAIN')?.quantity ?? 0;
    return inHand > allowed ? setHandCopies(next, cardId, allowed) : next;
}

/** Replaces the decklist with the Main and Extra Deck of a saved deck (the Side Deck is ignored). */
export function importDeckCards(
    draft: ComboDraft,
    deckCards: { section: DeckSection; quantity: number; card: Card }[],
): ComboDraft {
    const cards: DraftCard[] = [];
    for (const e of deckCards) {
        if (e.section !== 'MAIN' && e.section !== 'EXTRA') {
            continue;
        }
        const existing = cards.find((c) => c.card.id === e.card.id && c.section === e.section);
        if (existing) {
            existing.quantity += e.quantity;
        } else {
            cards.push({ card: e.card, section: e.section, quantity: e.quantity });
        }
    }
    // The old hand and steps refer to the old decklist
    return { ...draft, cards, startingHand: [], steps: [] };
}

export function entriesOf(draft: ComboDraft): ComboCardEntry[] {
    return draft.cards.map((c) => ({
        cardId: c.card.id,
        section: c.section,
        quantity: c.quantity,
    }));
}

/** Why the combo cannot be saved yet (the backend checks again). */
export function comboProblems(draft: ComboDraft): string[] {
    const problems: string[] = [];
    if (draft.name.trim() === '') {
        problems.push('Write a name for the Combo');
    }
    if (draft.cards.length === 0) {
        problems.push('Add at least one Card to the Decklist');
    }
    const counts = deckCounts(draft);
    if (counts.MAIN > COMBO_DECK_UI.mainMax) {
        problems.push(`Main Deck: at most ${COMBO_DECK_UI.mainMax} cards`);
    }
    if (counts.EXTRA > COMBO_DECK_UI.extraMax) {
        problems.push(`Extra Deck: at most ${COMBO_DECK_UI.extraMax} cards`);
    }
    if (draft.cards.length > 0) {
        // The same engine as the backend: hand and steps must still make sense
        problems.push(...replay(entriesOf(draft), draft.startingHand, draft.steps).errors);
    }
    return problems;
}

function emptyToNull(text: string): string | null {
    const trimmed = text.trim();
    return trimmed === '' ? null : trimmed;
}

/** Same content. The order of the decklist is saved, so a different order is a change. */
export function isSameComboDraft(a: ComboDraft, b: ComboDraft): boolean {
    const cardsKey = (d: ComboDraft) =>
        d.cards.map((c) => `${c.section}:${c.card.id}:${c.quantity}`).join(',');
    const handKey = (d: ComboDraft) => [...d.startingHand].sort((x, y) => x - y).join(',');
    return (
        a.name.trim() === b.name.trim() &&
        a.description.trim() === b.description.trim() &&
        cardsKey(a) === cardsKey(b) &&
        handKey(a) === handKey(b) &&
        JSON.stringify(a.steps) === JSON.stringify(b.steps)
    );
}

export function toComboPayload(draft: ComboDraft): ComboPayload {
    return {
        name: draft.name.trim(),
        description: emptyToNull(draft.description),
        cards: draft.cards.map((c) => ({
            cardId: c.card.id,
            section: c.section,
            quantity: c.quantity,
        })),
        startingHand: draft.startingHand,
        steps: draft.steps,
    };
}