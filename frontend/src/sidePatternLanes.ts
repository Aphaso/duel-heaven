import { isExtraDeckCard } from './deckRules';
import type { Card, SidePattern, SidePatternCard } from './types';

export type Lane = 'MAIN' | 'EXTRA';

/** Extra Deck Monsters swap with the Extra Deck, everything else with the Main Deck */
export function laneOf(card: Card): Lane {
    return isExtraDeckCard(card) ? 'EXTRA' : 'MAIN';
}

export interface LaneView {
    lane: Lane;
    cardsOut: SidePatternCard[];
    cardsIn: SidePatternCard[];
}

/** The lanes that actually have cards, Main first */
export function lanesOf(pattern: SidePattern): LaneView[] {
    const lanes: Lane[] = ['MAIN', 'EXTRA'];
    return lanes.map((lane) => ({
        lane,
        cardsOut: pattern.cardsOut.filter((c) => laneOf(c.card) === lane),
        cardsIn: pattern.cardsIn.filter((c) => laneOf(c.card) === lane),
    })).filter((l) => l.cardsOut.length > 0 || l.cardsIn.length > 0);
}

export function totalCopies(entries: SidePatternCard[]): number {
    return entries.reduce((sum, e) => sum + e.quantity, 0);
}