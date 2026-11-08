import type { Card, WthGuide, WthPayload } from './types';

/** Same limit as the backend (WTH_LIMITS.maxResponses). The backend stays the authority. */
export const WTH_MAX_RESPONSES = 10;

export interface WthDraftEntry {
    /** The opponent card we are afraid of. */
    card: Card;
    notes: string;
    /** The cards to activate in response, in order. */
    responses: Card[];
}

/** A WTH guide being edited: lives only in the browser until the user saves. */
export interface WthDraft {
    opponentDeckName: string;
    notes: string;
    entries: WthDraftEntry[];
}

export function emptyWthDraft(): WthDraft {
    return { opponentDeckName: '', notes: '', entries: [] };
}

export function draftFromGuide(guide: WthGuide): WthDraft {
    return {
        opponentDeckName: guide.opponentDeckName,
        notes: guide.notes ?? '',
        entries: guide.entries.map((e) => ({
            card: e.targetCard,
            notes: e.notes ?? '',
            responses: e.responses.map((r) => r.card),
        })),
    };
}

function mapEntry(
    draft: WthDraft,
    targetId: number,
    change: (entry: WthDraftEntry) => WthDraftEntry,
): WthDraft {
    return {
        ...draft,
        entries: draft.entries.map((e) => (e.card.id === targetId ? change(e) : e)),
    };
}

/** Adds an opponent card (once). */
export function addTarget(draft: WthDraft, card: Card): WthDraft {
    if (draft.entries.some((e) => e.card.id === card.id)) {
        return draft;
    }
    return { ...draft, entries: [...draft.entries, { card, notes: '', responses: [] }] };
}

export function removeTarget(draft: WthDraft, targetId: number): WthDraft {
    return { ...draft, entries: draft.entries.filter((e) => e.card.id !== targetId) };
}

/** Adds a response to an opponent card (no repeats, at most WTH_MAX_RESPONSES). */
export function addResponse(draft: WthDraft, targetId: number, card: Card): WthDraft {
    return mapEntry(draft, targetId, (entry) =>
        entry.responses.some((r) => r.id === card.id) ||
        entry.responses.length >= WTH_MAX_RESPONSES
            ? entry
            : { ...entry, responses: [...entry.responses, card] },
    );
}

export function removeResponse(draft: WthDraft, targetId: number, cardId: number): WthDraft {
    return mapEntry(draft, targetId, (entry) => ({
        ...entry,
        responses: entry.responses.filter((r) => r.id !== cardId),
    }));
}

export function setEntryNotes(draft: WthDraft, targetId: number, notes: string): WthDraft {
    return mapEntry(draft, targetId, (entry) => ({ ...entry, notes }));
}

/** Why the guide cannot be saved yet (UI hints: the backend checks again). */
export function wthProblems(draft: WthDraft): string[] {
    const problems: string[] = [];
    if (draft.opponentDeckName.trim() === '') {
        problems.push('Write the name of the Opponent Deck');
    }
    if (draft.entries.length === 0) {
        problems.push('Add at least one Opponent Card');
    }
    for (const e of draft.entries) {
        if (e.responses.length === 0) {
            problems.push(`${e.card.name}: add at least one Card to activate`);
        }
    }
    return problems;
}

/** Same content AND same order (the order is saved, so a different order is a change). */
export function isSameWthDraft(a: WthDraft, b: WthDraft): boolean {
    if (
        a.opponentDeckName.trim() !== b.opponentDeckName.trim() ||
        a.notes.trim() !== b.notes.trim() ||
        a.entries.length !== b.entries.length
    ) {
        return false;
    }
    return a.entries.every((ea, i) => {
        const eb = b.entries[i]!;
        return (
            ea.card.id === eb.card.id &&
            ea.notes.trim() === eb.notes.trim() &&
            ea.responses.length === eb.responses.length &&
            ea.responses.every((r, j) => r.id === eb.responses[j]!.id)
        );
    });
}

function emptyToNull(text: string): string | null {
    const trimmed = text.trim();
    return trimmed === '' ? null : trimmed;
}

export function toWthPayload(draft: WthDraft): WthPayload {
    return {
        opponentDeckName: draft.opponentDeckName.trim(),
        notes: emptyToNull(draft.notes),
        entries: draft.entries.map((e) => ({
            targetCardId: e.card.id,
            notes: emptyToNull(e.notes),
            responses: e.responses.map((r) => ({ cardId: r.id })),
        })),
    };
}