import { laneOf, type Lane } from './sidePatternLanes';
import type {
    Card,
    DeckCardEntry,
    SidePattern,
    SidePatternPayload,
} from './types';

export type Direction = 'OUT' | 'IN';

export interface PatternDraftEntry {
    card: Card;
    quantity: number;
}

/** A side pattern being edited: lives only in the browser until the user saves. */
export interface PatternDraft {
    opponentDeckName: string;
    notes: string;
    cardsOut: PatternDraftEntry[];
    cardsIn: PatternDraftEntry[];
}

const LANES: Lane[] = ['MAIN', 'EXTRA'];

export function emptyDraft(): PatternDraft {
    return { opponentDeckName: '', notes: '', cardsOut: [], cardsIn: [] };
}

export function draftFromPattern(pattern: SidePattern): PatternDraft {
    return {
        opponentDeckName: pattern.opponentDeckName,
        notes: pattern.notes ?? '',
        cardsOut: pattern.cardsOut.map((c) => ({ card: c.card, quantity: c.quantity })),
        cardsIn: pattern.cardsIn.map((c) => ({ card: c.card, quantity: c.quantity })),
    };
}

/** How many copies of a card are selected in a list. */
export function copiesOf(list: PatternDraftEntry[], card: Card): number {
    return list.find((e) => e.card.id === card.id)?.quantity ?? 0;
}

/** New draft with the copies of a card set in one of the two lists (0 or less removes it). */
export function setCopies(
    draft: PatternDraft,
    direction: Direction,
    card: Card,
    quantity: number,
): PatternDraft {
    const key = direction === 'OUT' ? 'cardsOut' : 'cardsIn';
    const list = draft[key];
    let next: PatternDraftEntry[];
    if (quantity <= 0) {
        next = list.filter((e) => e.card.id !== card.id);
    } else if (list.some((e) => e.card.id === card.id)) {
        next = list.map((e) => (e.card.id === card.id ? { ...e, quantity } : e));
    } else {
        next = [...list, { card, quantity }];
    }
    return { ...draft, [key]: next };
}

export interface Candidate {
    card: Card;
    /** Copies the SAVED decklist can give (0 = no longer in the decklist). */
    available: number;
}

export interface LanePool {
    lane: Lane;
    outCandidates: Candidate[];
    inCandidates: Candidate[];
}

function addCandidate(pool: Map<number, Candidate>, card: Card, quantity: number) {
    const current = pool.get(card.id);
    pool.set(card.id, { card, available: (current?.available ?? 0) + quantity });
}

/**
 * The cards the user can pick from, one pool per lane, taken from the SAVED decklist:
 * out = the Main (or Extra) deck, in = the Side deck cards that belong to that lane.
 * Cards already selected but no longer in the decklist stay visible (available 0),
 * otherwise the user could not remove them.
 */
export function lanePools(deckCards: DeckCardEntry[], draft: PatternDraft): LanePool[] {
    const pools: LanePool[] = [];
    for (const lane of LANES) {
        const out = new Map<number, Candidate>();
        const inn = new Map<number, Candidate>();
        for (const e of deckCards) {
            if (laneOf(e.card) !== lane) {
                continue;
            }
            if (e.section === lane) {
                addCandidate(out, e.card, e.quantity);
            }
            if (e.section === 'SIDE') {
                addCandidate(inn, e.card, e.quantity);
            }
        }
        for (const s of draft.cardsOut) {
            if (laneOf(s.card) === lane && !out.has(s.card.id)) {
                out.set(s.card.id, { card: s.card, available: 0 });
            }
        }
        for (const s of draft.cardsIn) {
            if (laneOf(s.card) === lane && !inn.has(s.card.id)) {
                inn.set(s.card.id, { card: s.card, available: 0 });
            }
        }
        if (out.size > 0 || inn.size > 0) {
            pools.push({
                lane,
                outCandidates: [...out.values()],
                inCandidates: [...inn.values()],
            });
        }
    }
    return pools;
}

export interface LaneTotals {
    outCount: number;
    inCount: number;
}

export function laneTotals(draft: PatternDraft): Record<Lane, LaneTotals> {
    const totals: Record<Lane, LaneTotals> = {
        MAIN: { outCount: 0, inCount: 0 },
        EXTRA: { outCount: 0, inCount: 0 },
    };
    for (const e of draft.cardsOut) {
        totals[laneOf(e.card)].outCount += e.quantity;
    }
    for (const e of draft.cardsIn) {
        totals[laneOf(e.card)].inCount += e.quantity;
    }
    return totals;
}

/** Each lane must move as many cards out as in. */
export function isBalanced(draft: PatternDraft): boolean {
    const totals = laneTotals(draft);
    return LANES.every((lane) => totals[lane].outCount === totals[lane].inCount);
}

export function hasName(draft: PatternDraft): boolean {
    return draft.opponentDeckName.trim() !== '';
}

function listKey(list: PatternDraftEntry[]): string {
    return list
        .map((e) => `${e.card.id}:${e.quantity}`)
        .sort()
        .join(',');
}

/** Same content, whatever the order the cards were clicked in. */
export function isSameDraft(a: PatternDraft, b: PatternDraft): boolean {
    return (
        a.opponentDeckName.trim() === b.opponentDeckName.trim() &&
        a.notes.trim() === b.notes.trim() &&
        listKey(a.cardsOut) === listKey(b.cardsOut) &&
        listKey(a.cardsIn) === listKey(b.cardsIn)
    );
}

/**
 * What is sent to the backend. The cards are sorted like the decklist, so the saved
 * order never depends on the order of the clicks.
 */
export function toPayload(
    draft: PatternDraft,
    deckCards: DeckCardEntry[],
): SidePatternPayload {
    const order = new Map<number, number>();
    deckCards.forEach((e, i) => {
        if (!order.has(e.cardId)) {
            order.set(e.cardId, i);
        }
    });
    const rank = (e: PatternDraftEntry) =>
        order.get(e.card.id) ?? Number.MAX_SAFE_INTEGER;
    const toRows = (list: PatternDraftEntry[]) =>
        [...list]
            .sort((a, b) => rank(a) - rank(b))
            .map((e) => ({ cardId: e.card.id, quantity: e.quantity }));

    const notes = draft.notes.trim();
    return {
        opponentDeckName: draft.opponentDeckName.trim(),
        notes: notes === '' ? null : notes,
        cardsOut: toRows(draft.cardsOut),
        cardsIn: toRows(draft.cardsIn),
    };
}