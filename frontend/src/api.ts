import { type Card, type Deck, type DeckDetail, type DeckSection, type Paginated, type SidePattern, type SidePatternPayload, type WthGuide, type WthGuideSummary, type WthPayload, type Combo, type ComboSummary, type ComboPayload } from './types';

/** Generic call: handles backend errors and 204 responses (no-body response). */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);

    if (!res.ok) {
        let message = `Server Error: ${res.status}`;
        try {
            const body = await res.json();
            // Nest returns `message` as text, or as a list (validation and rules).
            message = Array.isArray(body.message)
                ? body.message.join('\n')
                : (body.message ?? message);
        } catch {
            // the body wasn't JSON, so we keep the generic message
        }
        throw new Error(message);
    }

    if (res.status === 204) {
        return undefined as T;
    }
    return res.json();
}

function jsonBody(method: string, data: unknown): RequestInit {
    return {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    };
}

/** ---------------------------------------------------------- Handle Cards */

export async function searchCards(params: {
    search: string;
    page: number;
    limit: number;
}) {
    const query = new URLSearchParams({
        page: String(params.page),
        limit: String(params.limit),
    });
    if (params.search) {
        query.set('search', params.search);
    }
    return request<Paginated<Card>>(`/api/cards?${query}`);
}

// Card image address, provided by the backend
export function cardImageUrl(id: number) {
    return `/api/cards/${id}/image`;
}

/** ---------------------------------------------------------- Handle Decks */

export function listDecks() {
    return request<Deck[]>('/api/decks');
}

export function getDeck(id: string) {
    return request<DeckDetail>(`/api/decks/${id}`);
}

export function createDeck(data: { name: string, archetype?: string }) {
    return request<Deck>('/api/decks', jsonBody('POST', data));
}

export function updateDeck(id: string, data: { name?: string; archetype?: string | null }) {
    return request<DeckDetail>(`/api/decks/${id}`, jsonBody('PATCH', data));
}

export function deleteDeck(id: string) {
    return request<void>(`/api/decks/${id}`, { method: 'DELETE' });
}

/** ----------------------------------------------------------- Handle Deck */

export function saveDeckList(
    deckId: string,
    cards: { cardId: number; section: DeckSection; quantity: number }[],
) {
    return request<DeckDetail>(
        `/api/decks/${deckId}/list`,
        jsonBody('PUT', { cards })
    );
}

/** --------------------------------------------------------- Side Patterns */

export function listSidePatterns(deckId: string) {
    return request<SidePattern[]>(`/api/decks/${deckId}/side-patterns`);
}

export function createSidePattern(deckId: string, data: SidePatternPayload) {
    return request<SidePattern>(`/api/decks/${deckId}/side-patterns`, jsonBody('POST', data));
}

export function updateSidePattern(deckId: string, id: string, data: SidePatternPayload) {
    return request<SidePattern>(`/api/decks/${deckId}/side-patterns/${id}`, jsonBody('PUT', data));
}

export function deleteSidePattern(deckId: string, id: string) {
    return request<void>(`/api/decks/${deckId}/side-patterns/${id}`, { method: 'DELETE' });
}

/** ------------------------------------------------------------------ WTH? */

export function listWthGuides() {
    return request<WthGuideSummary[]>('/api/wth');
}

export function getWthGuide(id: string) {
    return request<WthGuide>(`/api/wth/${id}`);
}

export function createWthGuide(data: WthPayload) {
    return request<WthGuide>('/api/wth', jsonBody('POST', data));
}

export function updateWthGuide(id: string, data: WthPayload) {
    return request<WthGuide>(`/api/wth/${id}`, jsonBody('PUT', data));
}

export function deleteWthGuide(id: string) {
    return request<void>(`/api/wth/${id}`, { method: 'DELETE' });
}

/** ---------------------------------------------------------------- Combos */

export function listCombos() {
    return request<ComboSummary[]>('/api/combos');
}

export function getCombo(id: string) {
    return request<Combo>(`/api/combos/${id}`);
}

export function createCombo(data: ComboPayload) {
    return request<Combo>('/api/combos', jsonBody('POST', data));
}

export function updateCombo(id: string, data: ComboPayload) {
    return request<Combo>(`/api/combos/${id}`, jsonBody('PUT', data));
}

export function deleteCombo(id: string) {
    return request<void>(`/api/combos/${id}`, { method: 'DELETE' });
}