// The "engine" of the combos. It is pure: no database, no framework.
// The board is never stored: it is REBUILT by replaying the steps from the start.

export const PILE_ZONES = ['DECK', 'EXTRA', 'HAND', 'GRAVEYARD', 'BANISHED'] as const;
export const MONSTER_ZONES = [
    'MONSTER_1', 'MONSTER_2', 'MONSTER_3', 'MONSTER_4', 'MONSTER_5',
    'EXTRA_MONSTER_1', 'EXTRA_MONSTER_2',
] as const;
export const SPELL_ZONES = [
    'SPELL_1', 'SPELL_2', 'SPELL_3', 'SPELL_4', 'SPELL_5',
    'FIELD', 'PENDULUM_LEFT', 'PENDULUM_RIGHT',
] as const;
/** OVERLAY = Xyz material, attached to a monster (the "host"). */
export const ZONES = [...PILE_ZONES, ...MONSTER_ZONES, ...SPELL_ZONES, 'OVERLAY'] as const;
export type Zone = (typeof ZONES)[number];

const SINGLE_ZONES = new Set<string>([...MONSTER_ZONES, ...SPELL_ZONES]);
const MONSTER_ZONE_SET = new Set<string>(MONSTER_ZONES);

export const FACES = ['UP', 'DOWN'] as const;
export const POSITIONS = ['ATK', 'DEF'] as const;
export type Face = (typeof FACES)[number];
export type BattlePosition = (typeof POSITIONS)[number];

export const STEP_KINDS = [
    'NORMAL_SUMMON', 'SET', 'SPECIAL_SUMMON',
    'ACTIVATE_CARD', 'ACTIVATE_EFFECT', 'TRIGGER_EFFECT', 'OTHER',
] as const;
export type StepKind = (typeof STEP_KINDS)[number];

export const COMBO_LIMITS = { maxSteps: 300, maxMovesPerStep: 50, maxNote: 500 } as const;

/** One copy of a card in the combo decklist: "MAIN:1234:0" = first copy of card 1234 in the Main. */
export type InstanceId = string;

export interface ComboCardEntry {
    cardId: number;
    section: 'MAIN' | 'EXTRA';
    quantity: number;
}

export interface CardState {
    id: InstanceId;
    cardId: number;
    zone: Zone;
    face: Face;
    position: BattlePosition;
    /** Only for zone OVERLAY: the monster the card is attached to. */
    host: InstanceId | null;
}
/** The order of the array is the order of arrival (it is the order of the hand). */
export type Board = CardState[];

export type Move =
    | { type: 'MOVE'; instance: InstanceId; to: Zone; host?: InstanceId; face?: Face; position?: BattlePosition }
    | { type: 'SET_STATE'; instance: InstanceId; face?: Face; position?: BattlePosition };

export interface ComboStep {
    kind: StepKind;
    /** The card that does the action (null for "other"). */
    source: InstanceId | null;
    note: string;
    moves: Move[];
}

export function instanceId(section: 'MAIN' | 'EXTRA', cardId: number, copy: number): InstanceId {
    return `${section}:${cardId}:${copy}`;
}

/** The card behind an instance id, or null if the id is malformed. */
export function cardIdOf(instance: InstanceId): number | null {
    const n = Number(instance.split(':')[1]);
    return Number.isInteger(n) ? n : null;
}

type Result<T> = ({ error?: undefined } & T) | { error: string };

export function initialBoard(entries: ComboCardEntry[], startingHand: number[]): Result<{ board: Board }> {
    const board: Board = [];
    for (const e of entries) {
        for (let copy = 0; copy < e.quantity; copy++) {
            board.push({
                id: instanceId(e.section, e.cardId, copy),
                cardId: e.cardId,
                zone: e.section === 'MAIN' ? 'DECK' : 'EXTRA',
                face: 'DOWN',
                position: 'ATK',
                host: null,
            });
        }
    }
    for (const cardId of startingHand) {
        const copy = board.find((c) => c.cardId === cardId && c.zone === 'DECK');
        if (!copy) {
            return { error: `Starting Hand: not enough copies of ${cardId} in Main Deck` };
        }
        copy.zone = 'HAND';
        copy.face = 'UP';
    }
    return { board };
}

function defaultFace(zone: Zone): Face {
    return zone === 'DECK' || zone === 'EXTRA' ? 'DOWN' : 'UP';
}

export function applyMove(board: Board, move: Move): Result<{ board: Board }> {
    const card = board.find((c) => c.id === move.instance);
    if (!card) {
        return { error: `The Card ${move.instance} does not exist in the Combo` };
    }

    if (move.type === 'SET_STATE') {
        return {
            board: board.map((c) =>
                c.id === card.id
                    ? { ...c, face: move.face ?? c.face, position: move.position ?? c.position }
                    : c,
            ),
        };
    }

    const to = move.to;
    if (to === 'OVERLAY') {
        const host = board.find((c) => c.id === move.host);
        if (!host || host.id === card.id) {
            return { error: 'An Xyz material must be linked to another monster' };
        }
        if (!MONSTER_ZONE_SET.has(host.zone)) {
            return { error: 'An Xyz material can be linked to one Monster only on the Field' };
        }
    } else if (move.host !== undefined) {
        return { error: 'Only Xyz materials (OVERLAY Zone) have an host Monster' };
    }
    if (SINGLE_ZONES.has(to)) {
        const occupant = board.find((c) => c.zone === to && c.id !== card.id);
        if (occupant) {
            return { error: `Zone ${to} is already in use: move the other Card first` };
        }
    }

    // The moved card leaves its place and arrives LAST (it matters for the hand order)
    const moved: CardState = {
        ...card,
        zone: to,
        host: to === 'OVERLAY' ? (move.host ?? null) : null,
        face: move.face ?? defaultFace(to),
        position: move.position ?? 'ATK',
    };
    let next = [...board.filter((c) => c.id !== card.id), moved];

    // A monster that is no longer on the field loses its materials: they go to the graveyard
    if (!MONSTER_ZONE_SET.has(to)) {
        next = next.map((c) =>
            c.host === card.id ? { ...c, zone: 'GRAVEYARD', host: null, face: 'UP' } : c,
        );
    }
    return { board: next };
}

export function applyStep(board: Board, step: ComboStep): Result<{ board: Board }> {
    if (step.source !== null && !board.some((c) => c.id === step.source)) {
        return { error: `The Card ${step.source} does not exist in the Combo` };
    }
    let current = board;
    for (const [i, move] of step.moves.entries()) {
        const r = applyMove(current, move);
        if (r.error !== undefined) {
            return { error: `Move ${i + 1}: ${r.error}` };
        }
        current = r.board;
    }
    return { board: current };
}

const isObject = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null && !Array.isArray(v);
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
    typeof v === 'string' && (list as readonly string[]).includes(v);

function parseMove(raw: unknown): Result<{ move: Move }> {
    if (!isObject(raw) || typeof raw.instance !== 'string') {
        return { error: 'Invalid Move' };
    }
    const face = raw.face;
    const position = raw.position;
    if (face !== undefined && !oneOf(FACES, face)) {
        return { error: 'Invalid Face' };
    }
    if (position !== undefined && !oneOf(POSITIONS, position)) {
        return { error: 'Invalid Position' };
    }
    if (raw.type === 'MOVE') {
        if (!oneOf(ZONES, raw.to)) {
            return { error: 'Invalid Destination Zone' };
        }
        if (raw.host !== undefined && typeof raw.host !== 'string') {
            return { error: 'Invalid Host' };
        }
        return { move: { type: 'MOVE', instance: raw.instance, to: raw.to, host: raw.host, face, position } };
    }
    if (raw.type === 'SET_STATE') {
        if (face === undefined && position === undefined) {
            return { error: 'SET_STATE with nothing to change' };
        }
        return { move: { type: 'SET_STATE', instance: raw.instance, face, position } };
    }
    return { error: 'Unknown move type' };
}

export function parseStep(raw: unknown): Result<{ step: ComboStep }> {
    if (!isObject(raw)) {
        return { error: 'Invalid Step' };
    }
    if (!oneOf(STEP_KINDS, raw.kind)) {
        return { error: 'Invalid Step Type' };
    }
    if (raw.source !== null && typeof raw.source !== 'string') {
        return { error: 'Invalid Source Card' };
    }
    const note = raw.note ?? '';
    if (typeof note !== 'string' || note.length > COMBO_LIMITS.maxNote) {
        return { error: `A Note can have at most ${COMBO_LIMITS.maxNote} characters` };
    }
    if (!Array.isArray(raw.moves) || raw.moves.length > COMBO_LIMITS.maxMovesPerStep) {
        return { error: `A Step can have at most ${COMBO_LIMITS.maxMovesPerStep} moves` };
    }
    const moves: Move[] = [];
    for (const m of raw.moves) {
        const r = parseMove(m);
        if (r.error !== undefined) {
            return { error: r.error };
        }
        moves.push(r.move);
    }
    return { step: { kind: raw.kind, source: raw.source, note: note.trim(), moves } };
}

export interface Replay {
    /** boards[0] = start, boards[i + 1] = after step i. */
    boards: Board[];
    steps: ComboStep[];
    errors: string[];
}

/** Rebuilds the whole combo. Stops at the first error. */
export function replay(entries: ComboCardEntry[], startingHand: number[], rawSteps: unknown[]): Replay {
    const start = initialBoard(entries, startingHand);
    if (start.error !== undefined) {
        return { boards: [], steps: [], errors: [start.error] };
    }
    const boards: Board[] = [start.board];
    const steps: ComboStep[] = [];
    for (const [i, raw] of rawSteps.entries()) {
        const parsed = parseStep(raw);
        if (parsed.error !== undefined) {
            return { boards, steps, errors: [`Step ${i + 1}: ${parsed.error}`] };
        }
        const applied = applyStep(boards[i]!, parsed.step);
        if (applied.error !== undefined) {
            return { boards, steps, errors: [`Step ${i + 1}: ${applied.error}`] };
        }
        steps.push(parsed.step);
        boards.push(applied.board);
    }
    return { boards, steps, errors: [] };
}