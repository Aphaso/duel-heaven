import type { Card, Paginated } from './types';

export async function searchCards(params: {
    search: string;
    page: number;
    limit: number;
}): Promise<Paginated<Card>> {
    const query = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
    });
    if (params.search) {
        query.set('search', params.search);
    }

    const res = await fetch(`/api/cards?${query}`);
    if (!res.ok) {
        throw new Error(`Errore dal server: ${res.status}`);
    }
    return res.json();
}

export function cardImageUrl(id: number) {
    return `/api/cards/${id}/image`;
}