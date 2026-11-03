import type { Card, DeckSection } from './types';

/*
    IMPORTANT!
    This const declaration is just an helper for the frontend interface:
    the actual limitation rule is in the backend (backend/src/decks/deck.rules.ts).
    Therefore, if something here were to change, make sure to update the backend file as well.
*/
const EXTRA_DECK_FRAMES = [
    'fusion',
    'synchro',
    'xyz',
    'link',
    'fusion_pendulum',
    'synchro_pendulum',
    'xyz_pendulum',
];

export function isExtraDeckCard(card: Card): boolean {
    return card.frameType !== null && EXTRA_DECK_FRAMES.includes(card.frameType);
}

export function allowedSections(card: Card): DeckSection[] {
    if (card.frameType === null) {
        return ['MAIN', 'EXTRA', 'SIDE'];
    }
    return isExtraDeckCard(card) ? ['EXTRA', 'SIDE'] : ['MAIN', 'SIDE'];
}