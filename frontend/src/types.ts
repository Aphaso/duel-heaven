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