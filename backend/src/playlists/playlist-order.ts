/**
 * Check if wanted is exactly the same set of ids as current, regardless of order
 */
export function sameIds(current: string[], wanted: string[]): boolean {
    if (current.length !== wanted.length) {
        return false;
    }
    const known = new Set(current);
    return new Set(wanted).size === wanted.length && wanted.every((id) => known.has(id));
}