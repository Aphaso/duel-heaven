export interface Card {
    id: number;
    name: string;
    type: string;
    frameType: string | null;
    desc: string;
    atk: number | null;
    def: number | null;
    level: number | null;
    race: string | null;
    attribute: string | null;
    archetype: string | null;
}

export interface Paginated<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export type DeckSection = 'MAIN' | 'EXTRA' | 'SIDE';

export interface Deck {
    id: string;
    name: string;
    archetype: string | null;
    description: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface DeckCardEntry {
    id: string;
    cardId: number;
    section: DeckSection;
    quantity: number;
    card: Card;
}

export interface DeckSummary {
    counts: Record<DeckSection, number>;
    limits: {
        mainMin: number;
        mainMax: number;
        extraMax: number;
        sideMax: number;
        maxCopies: number;
    };
    complete: boolean;
    issues: string[];
}

export interface DeckDetail extends Deck {
    cards: DeckCardEntry[];
    summary: DeckSummary;
}

export interface SidePatternCard {
    id: string;
    cardId: number;
    quantity: number;
    position: number;
    direction: 'OUT' | 'IN';
    card: Card;
}

export interface SidePattern {
    id: string;
    deckId: string;
    opponentDeckName: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    cardsOut: SidePatternCard[];
    cardsIn: SidePatternCard[];
    issues: string[];
}

export interface SidePatternPayload {
    opponentDeckName: string;
    notes: string | null;
    cardsOut: { cardId: number; quantity: number }[];
    cardsIn: { cardId: number; quantity: number }[];
}

export interface WthResponse {
    id: string;
    cardId: number;
    position: number;
    card: Card;
}

export interface WthEntry {
    id: string;
    targetCardId: number;
    notes: string | null;
    position: number;
    targetCard: Card;
    responses: WthResponse[];
}

export interface WthGuide {
    id: string;
    opponentDeckName: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
    entries: WthEntry[];
}

export interface WthGuideSummary {
    id: string;
    opponentDeckName: string;
    notes: string | null;
    updatedAt: string;
    _count: { entries: number };
}

export interface WthPayload {
    opponentDeckName: string;
    notes: string | null;
    entries: {
        targetCardId: number;
        notes: string | null;
        responses: { cardId: number }[];
    }[];
}