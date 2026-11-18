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

/** Background of every type of zone: monsters blue, spells/traps green, the piles neutral. */
function tintOf(zone: GridZone): string {
    if (zone.startsWith('MONSTER') || zone.startsWith('EXTRA_MONSTER')) {
        return 'bg-aether-950/40';
    }
    if (zone.startsWith('SPELL') || zone.startsWith('PENDULUM') || zone === 'FIELD') {
        return 'bg-frame-spell/8';
    }
    return 'bg-night-900/70';
}
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
    const ring = selected
        ? 'ring-2 ring-primary shadow-glow-primary'
        : highlighted
          ? 'ring-2 ring-relic-400 shadow-glow-accent'
          : 'shadow-card';
    const classes = ['h-full rounded-[3px] transition-[transform,box-shadow] duration-300', state.position === 'DEF' ? 'rotate-90' : '', ring].join(' ');

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
    tint,
    active,
    onClick,
    children,
}: {
    label: string;
    col: number;
    row: number;
    /** Background color of the zone type (monster, spell/trap, pile). */
    tint: string;
    /** The selected card is in this zone. */
    active: boolean;
    onClick?: () => void;
    children?: ReactNode;
}) {
    return (
        <div
            onClick={onClick}
            data-keep-selection
            className={`relative aspect-square rounded-control border transition-colors ${tint} ${
                active ? 'border-primary shadow-glow-primary' : 'border-white/8'
            } ${onClick ? 'cursor-pointer hover:border-aether-700 hover:bg-aether-950/60' : ''}`}
            style={{ gridColumn: col, gridRow: row }}
        >
            <span className='pointer-events-none absolute top-0.5 left-1 z-10 hidden font-display text-[0.5625rem] font-semibold tracking-wide text-ink-faint uppercase sm:block'>
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
            className='numeric absolute right-0.5 bottom-0.5 z-10 rounded bg-night-950/90 px-1 text-micro text-ink ring-1 ring-white/10'
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
        <div className='space-y-3 rounded-panel border border-line bg-surface-sunken p-2 shadow-panel sm:p-3'>
            <div
                className='grid gap-1 rounded-control bg-[radial-gradient(ellipse_at_center,rgb(31_198_245/0.06),transparent_70%)] sm:gap-1.5'
                style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
            >
                {(Object.keys(LAYOUT) as GridZone[]).map((zone) => {
                    const { col, row, label } = LAYOUT[zone];
                    const inZone = groups[zone] ?? [];
                    const onClick = onZoneClick ? () => onZoneClick(zone) : undefined;
                    const active = selectedZone === zone;

                    if (PILES.has(zone)) {
                        const top = inZone[inZone.length - 1];
                        return (
                            <Slot key={zone} label={label} col={col} row={row} tint={tintOf(zone)} active={active} onClick={onClick}>
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
                        <Slot key={zone} label={label} col={col} row={row} tint={tintOf(zone)} active={active} onClick={onClick}>
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
                <h3 className='label mb-1.5 flex items-center gap-2 text-ink-subtle'>
                    Hand
                    <span className='numeric text-ink-faint'>{hand.length}</span>
                </h3>
                <div
                    onClick={onZoneClick ? () => onZoneClick('HAND') : undefined}
                    data-keep-selection
                    className={`flex min-h-28 flex-wrap items-center gap-2 rounded-control border border-white/8 bg-night-900/70 p-2 ${
                        onZoneClick ? 'cursor-pointer transition-colors hover:border-aether-700 hover:bg-aether-950/60' : ''
                    }`}
                >
                    {hand.length === 0 && <span className='w-full text-center text-sm text-ink-faint'>Empty Hand</span>}
                    {hand.map((state) => (
                        <div
                            key={state.id}
                            className={`h-24 ${onCardClick ? 'cursor-pointer transition-transform hover:-translate-y-1' : ''}`}
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