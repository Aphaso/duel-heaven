import { applyMove, applyStep, COMBO_LIMITS, MONSTER_ZONES, type Board, type CardState, type ComboStep, type Move, type StepKind, type Zone } from './comboEngine';
import { cardOfInstance } from './comboPlayback';
import type { Card } from './types';

export const ZONE_LABEL: Record<Zone, string> = {
    DECK: 'Deck',
    EXTRA: 'Extra Deck',
    HAND: 'Hand',
    GRAVEYARD: 'Graveyard',
    BANISHED: 'Banished',
    MONSTER_1: 'Monster Zone 1',
    MONSTER_2: 'Monster Zone 2',
    MONSTER_3: 'Monster Zone 3',
    MONSTER_4: 'Monster Zone 4',
    MONSTER_5: 'Monster Zone 5',
    EXTRA_MONSTER_1: 'Extra Monster Zone 1',
    EXTRA_MONSTER_2: 'Extra Monster Zone 2',
    SPELL_1: 'Spell/Trap Zone 1',
    SPELL_2: 'Spell/Trap Zone 2',
    SPELL_3: 'Spell/Trap Zone 3',
    SPELL_4: 'Spell/Trap Zone 4',
    SPELL_5: 'Spell/Trap Zone 5',
    FIELD: 'Field Zone',
    PENDULUM_LEFT: 'Left Pendulum Zone',
    PENDULUM_RIGHT: 'Right Pendulum Zone',
    OVERLAY: 'Xyz material',
};

/** The step the user is building: it is only added to the combo when they confirm. */
export interface PendingStep {
    kind: StepKind;
    source: string | null;
    note: string;
    moves: Move[];
}

export function emptyPending(): PendingStep {
    return { kind: 'OTHER', source: null, note: '', moves: [] };
}

/** The board after the moves of the pending step (it stops at the first move that does not apply). */
export function boardWithMoves(base: Board, moves: Move[]): Board {
    let board = base;
    for (const move of moves) {
        const result = applyMove(board, move);
        if (result.error !== undefined) {
            break;
        }
        board = result.board;
    }
    return board;
}

function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Adds a move to the pending ones, but only if the engine accepts it. */
export function tryAddMove(
    base: Board,
    moves: Move[],
    move: Move,
): { moves: Move[]; error?: undefined } | { error: string } {
    if (moves.length >= COMBO_LIMITS.maxMovesPerStep) {
        return { error: `A step can have at most ${COMBO_LIMITS.maxMovesPerStep} moves` };
    }
    const result = applyMove(boardWithMoves(base, moves), move);
    if (result.error !== undefined) {
        return { error: capitalize(result.error) };
    }
    return { moves: [...moves, move] };
}

export type ZoneClickResult =
    | { type: 'move'; move: Move }
    | { type: 'select'; instance: string }
    | { type: 'browse'; zone: Zone }
    | { type: 'error'; message: string }
    | { type: 'none' };

const PILES = new Set<Zone>(['DECK', 'EXTRA', 'GRAVEYARD', 'BANISHED']);
const MONSTERS = new Set<Zone>(MONSTER_ZONES);

/** What a click on a zone means, given the selected card and the "attach as material" mode. */
export function resolveZoneClick(
    board: Board,
    zone: Zone,
    selectedId: string | null,
    attaching: boolean,
): ZoneClickResult {
    const inZone = board.filter((c) => c.zone === zone);
    const top = inZone[inZone.length - 1];
    const selected = selectedId ? board.find((c) => c.id === selectedId) : undefined;

    if (attaching && selected) {
        if (!MONSTERS.has(zone) || !top) {
            return { type: 'error', message: 'Click a Monster on the field to attach the material to' };
        }
        if (top.id === selected.id) {
            return { type: 'error', message: 'A card cannot be its own material' };
        }
        return { type: 'move', move: { type: 'MOVE', instance: selected.id, to: 'OVERLAY', host: top.id } };
    }

    if (selected) {
        if (selected.zone === zone) {
            return PILES.has(zone) ? { type: 'browse', zone } : { type: 'none' };
        }
        const isPile = PILES.has(zone) || zone === 'HAND';
        if (!isPile && top && top.id !== selected.id) {
            // Occupied zone: the click selects the card that is there
            return { type: 'select', instance: top.id };
        }
        return { type: 'move', move: { type: 'MOVE', instance: selected.id, to: zone } };
    }

    if (!top) {
        return { type: 'none' };
    }
    if (PILES.has(zone)) {
        return { type: 'browse', zone };
    }
    return zone === 'HAND' ? { type: 'none' } : { type: 'select', instance: top.id };
}

export function flipMove(card: CardState): Move {
    return { type: 'SET_STATE', instance: card.id, face: card.face === 'UP' ? 'DOWN' : 'UP' };
}

export function turnMove(card: CardState): Move {
    return { type: 'SET_STATE', instance: card.id, position: card.position === 'ATK' ? 'DEF' : 'ATK' };
}

export function describeMove(move: Move, cards: Map<number, Card>): string {
    const name = cardOfInstance(move.instance, cards)?.name ?? move.instance;
    if (move.type === 'MOVE') {
        const host = move.host ? ` of ${cardOfInstance(move.host, cards)?.name ?? move.host}` : '';
        return `${name} → ${ZONE_LABEL[move.to]}${host}`;
    }
    const parts: string[] = [];
    if (move.face) {
        parts.push(move.face === 'UP' ? 'face-up' : 'face-down');
    }
    if (move.position) {
        parts.push(move.position === 'ATK' ? 'attack' : 'defense');
    }
    return `${name}: ${parts.join(', ')}`;
}

/** Turns the pending step into a real step, after checking that it applies to the board. */
export function commitPending(
    base: Board,
    pending: PendingStep,
): { step: ComboStep; error?: undefined } | { error: string } {
    const step: ComboStep = {
        kind: pending.kind,
        source: pending.source,
        note: pending.note.trim(),
        moves: pending.moves,
    };
    if (step.note.length > COMBO_LIMITS.maxNote) {
        return { error: `The note can have at most ${COMBO_LIMITS.maxNote} characters` };
    }
    const result = applyStep(base, step);
    if (result.error !== undefined) {
        return { error: capitalize(result.error) };
    }
    return { step };
}

/**
 * Deletes the step at 'index' and every step after it: the combo goes back to how it was right before that step.
 * An index outside the list changes nothing.
 */
export function removeStepsFrom(steps: ComboStep[], index: number): ComboStep[] {
    if (!Number.isInteger(index) || index < 0 || index >= steps.length) {
        return steps;
    }
    return steps.slice(0, index);
}