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