/**
 * The items in the order of ids.
 * Items that are not in ids go at the end. keeping their order.
 * ids without an item are ignored.
 */
export function sortByIds<T extends { id: string }>(items: T[], ids: string[]): T[] {
    const rank = new Map(ids.map((id, i) => [id, i]));
    const outside = ids.length;
    return [...items].sort((a, b) => (rank.get(a.id) ?? outside) - (rank.get(b.id) ?? outside));
}