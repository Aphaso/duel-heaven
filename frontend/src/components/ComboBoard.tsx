import type { ReactNode } from 'react';
import { cardImageUrl } from '../api';
import type { Board, CardState, Zone } from '../comboEngine';
import { cardsByZone, materialsOf } from '../comboPlayback';
import type { Card } from '../types';

interface Props {
    board: Board;
    cards: Map<number, Card>;
    /** Instances to highlight (what the current step changed). */
    changed: Set<string>;
    /** Interactive mode (the editor): the selected card and the click handlers. */
    selected?: string | null;
    onZoneClick?: (zone: Zone) => void;
    /** A click on a card of the hand. */
    onCardClick?: (instance: string) => void;
}

type GridZone = Exclude<Zone, 'OVERLAY' | 'HAND'>;

// Column and row of every zone in the grid (7 columns)
const LAYOUT: Record<GridZone, { col: number; row: number; label: string }> = {
    EXTRA_MONSTER_1: { col: 3, row: 1, label: 'Extra M. 1' },
    EXTRA_MONSTER_2: { col: 5, row: 1, label: 'Extra M. 2' },
    FIELD: { col: 1, row: 2, label: 'Field' },
    MONSTER_1: { col: 2, row: 2, label: 'M 1' },
    MONSTER_2: { col: 3, row: 2, label: 'M 2' },
    MONSTER_3: { col: 4, row: 2, label: 'M 3' },
    MONSTER_4: { col: 5, row: 2, label: 'M 4' },
    MONSTER_5: { col: 6, row: 2, label: 'M 5' },
    GRAVEYARD: { col: 7, row: 2, label: 'Graveyard' },
    EXTRA: { col: 1, row: 3, label: 'Extra Deck' },
    SPELL_1: { col: 2, row: 3, label: 'S/T 1' },
    SPELL_2: { col: 3, row: 3, label: 'S/T 2' },
    SPELL_3: { col: 4, row: 3, label: 'S/T 3' },
    SPELL_4: { col: 5, row: 3, label: 'S/T 4' },
    SPELL_5: { col: 6, row: 3, label: 'S/T 5' },
    DECK: { col: 7, row: 3, label: 'Deck' },
    PENDULUM_LEFT: { col: 2, row: 4, label: 'Pendulum L' },
    PENDULUM_RIGHT: { col: 6, row: 4, label: 'Pendulum R' },
    BANISHED: { col: 7, row: 4, label: 'Banished' },
};

const PILES = new Set<GridZone>(['DECK', 'EXTRA', 'GRAVEYARD', 'BANISHED']);
const HIDDEN_PILES = new Set<GridZone>(['DECK', 'EXTRA']);

function CardImage({
    state,
    card,
    highlighted,
    selected = false,
}: {
    state: CardState;
    card: Card | undefined;
    highlighted: boolean;
    selected?: boolean;
}) {
    const ring = selected ? 'ring-2 ring-blue-500' : highlighted ? 'ring-2 ring-amber-400' : '';
    const classes = ['h-full rounded-sm', state.position === 'DEF' ? 'rotate-90' : '', ring].join(' ');

    if (state.face === 'DOWN') {
        return (
            <img
                src='/card-back.jpg'
                alt='Face-down Card'
                title='Face-down Card'
                draggable={false}
                className={classes}
            >
            </img>
        );
    }
    return (
        <img
            src={cardImageUrl(state.cardId)}
            alt={card?.name ?? 'Card'}
            title={card?.name}
            draggable={false}
            className={classes}
        >
        </img>
    );
}

function Slot({
    label,
    col,
    row,
    active,
    onClick,
    children,
}: {
    label: string;
    col: number;
    row: number;
    /** The selected card is in this zone. */
    active: boolean;
    onClick?: () => void;
    children?: ReactNode;
}) {
    return (
        <div
            onClick={onClick}
            className={`relative aspect-square rounded border border-dashed bg-gray-50 ${
                active ? 'border-blue-500' : 'border-gray-300'
            } ${onClick ? 'cursor-pointer hover:bg-blue-50' : ''}`}
            style={{ gridColumn: col, gridRow: row }}
        >
            <span className='pointer-events-none absolute left-0.5 top-0 z-10 text-[9px] uppercase text-gray-400'>
                {label}
            </span>
            <div className='absolute inset-0 flex items-center justify-center p-1'>{children}</div>
        </div>
    );
}

function Badge({ children, title }: { children: ReactNode; title?: string }) {
    return (
        <span
            title={title}
            className='absolute bottom-0.5 right-0.5 z-10 rounded bg-gray-800 px-1 text-[10px] text-white'
        >
            {children}
        </span>
    );
}

export default function ComboBoard({
    board,
    cards,
    changed,
    selected = null,
    onZoneClick,
    onCardClick,
}: Props) {
    const groups = cardsByZone(board);
    const hand = groups.HAND ?? [];
    const selectedZone = selected ? board.find((c) => c.id === selected)?.zone : undefined;

    return (
        <div className='space-y-3'>
            <div className='grid gap-1' style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                {(Object.keys(LAYOUT) as GridZone[]).map((zone) => {
                    const { col, row, label } = LAYOUT[zone];
                    const inZone = groups[zone] ?? [];
                    const onClick = onZoneClick ? () => onZoneClick(zone) : undefined;
                    const active = selectedZone === zone;

                    if (PILES.has(zone)) {
                        const top = inZone[inZone.length - 1];
                        return (
                            <Slot key={zone} label={label} col={col} row={row} active={active} onClick={onClick}>
                                {top && (
                                    <>
                                        <CardImage
                                            // Deck and Extra Deck show the back, the others the top card
                                            state={{
                                                ...top,
                                                position: 'ATK',
                                                face: HIDDEN_PILES.has(zone) ? 'DOWN' : 'UP',
                                            }}
                                            card={cards.get(top.cardId)}
                                            highlighted={inZone.some((c) => changed.has(c.id))}
                                        />
                                        <Badge>×{inZone.length}</Badge>
                                    </>
                                )}
                            </Slot>
                        );
                    }

                    const state = inZone[0];
                    const materials = state ? materialsOf(board, state.id) : [];
                    return (
                        <Slot key={zone} label={label} col={col} row={row} active={active} onClick={onClick}>
                            {state && (
                                <>
                                    <CardImage
                                        state={state}
                                        card={cards.get(state.cardId)}
                                        highlighted={changed.has(state.id)}
                                        selected={state.id === selected}
                                    >
                                    </CardImage>
                                    {materials.length > 0 && (
                                        <Badge
                                            title={materials
                                                .map((m) => cards.get(m.cardId)?.name ?? '?')
                                                .join(', ')}
                                        >
                                            ◎ {materials.length}
                                        </Badge>
                                    )}
                                </>
                            )}
                        </Slot>
                    );
                })}
            </div>

            <div>
                <h3 className='mb-1 text-xs font-semibold uppercase text-gray-500'>Hand</h3>
                <div
                    onClick={onZoneClick ? () => onZoneClick('HAND') : undefined}
                    className={`flex min-h-28 flex-wrap gap-2 rounded border bg-gray-50 p-2 ${
                        onZoneClick ? 'cursor-pointer hover:bg-blue-50' : ''
                    }`}
                >
                    {hand.length === 0 && <span className='text-sm text-gray-400'>Empty Hand</span>}
                    {hand.map((state) => (
                        <div
                            key={state.id}
                            className='h-24'
                            onClick={
                                onCardClick
                                    ? (e) => {
                                          // The click is for the card, not for the hand area behind it
                                          e.stopPropagation();
                                          onCardClick(state.id);
                                      }
                                    : undefined
                            }
                        >
                            <CardImage
                                state={state}
                                card={cards.get(state.cardId)}
                                highlighted={changed.has(state.id)}
                                selected={state.id === selected}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}