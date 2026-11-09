import type { ComboSummary, Playlist, PlaylistPayload } from './types';

/** Same limit as the backend (SavePlaylistDto). The backend stays the authority. */
export const PLAYLIST_MAX_COMBOS = 100;

/** A playlist being edited: lives only in the browser until the user saves. */
export interface PlaylistDraft {
    name: string;
    description: string;
    /** The combos of the playlist, in playing order. */
    combos: ComboSummary[];
}

export function emptyPlaylistDraft(): PlaylistDraft {
    return { name: '', description: '', combos: [] };
}

export function draftFromPlaylist(playlist: Playlist): PlaylistDraft {
    return {
        name: playlist.name,
        description: playlist.description ?? '',
        combos: playlist.combos.map((row) => row.combo),
    };
}

/** Moves a combo into the playlist (at the end). A combo can be there only once. */
export function addCombo(draft: PlaylistDraft, combo: ComboSummary): PlaylistDraft {
    if (draft.combos.length >= PLAYLIST_MAX_COMBOS || draft.combos.some((c) => c.id === combo.id)) {
        return draft;
    }
    return { ...draft, combos: [...draft.combos, combo] };
}

/** Moves a combo out of the playlist (the combo itself is not deleted). */
export function removeCombo(draft: PlaylistDraft, comboId: string): PlaylistDraft {
    return { ...draft, combos: draft.combos.filter((c) => c.id !== comboId) };
}

/** Moves a combo one place up (-1) or down (+1). At the ends nothing happens. */
export function shiftCombo(draft: PlaylistDraft, index: number, direction: -1 | 1): PlaylistDraft {
    const target = index + direction;
    if (index < 0 || index >= draft.combos.length || target < 0 || target >= draft.combos.length) {
        return draft;
    }
    const combos = [...draft.combos];
    [combos[index], combos[target]] = [combos[target]!, combos[index]!];
    return { ...draft, combos };
}

/** The combos that can still be added: all the user's combos except the ones already in. */
export function availableCombos(all: ComboSummary[], draft: PlaylistDraft): ComboSummary[] {
    const inside = new Set(draft.combos.map((c) => c.id));
    return all.filter((c) => !inside.has(c.id));
}

export function playlistProblems(draft: PlaylistDraft): string[] {
    return draft.name.trim() === '' ? ['Write a name for the Playlist'] : [];
}

/** Same content AND same order (the order is saved, so a different order is a change). */
export function isSamePlaylistDraft(a: PlaylistDraft, b: PlaylistDraft): boolean {
    return (
        a.name.trim() === b.name.trim() &&
        a.description.trim() === b.description.trim() &&
        a.combos.length === b.combos.length &&
        a.combos.every((c, i) => c.id === b.combos[i]!.id)
    );
}

export function toPlaylistPayload(draft: PlaylistDraft): PlaylistPayload {
    const description = draft.description.trim();
    return {
        name: draft.name.trim(),
        description: description === '' ? null : description,
        comboIds: draft.combos.map((c) => c.id),
    };
}