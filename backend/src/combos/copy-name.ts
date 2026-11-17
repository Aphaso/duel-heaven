// " (copy)" or " (copy nr.)" at the end of a name
const COPY_SUFFIX = /\s\(copy(?: \d+)?\)$/;

/**
 * The name for a copy: "X (copy)", then "X (copy 2)", "X (copy 3)"...
 * Copying a copy does not pile up suffixes, and the result never exceeds maxLength
 */
export function nextCopyName(name: string, existing: string[], maxLength = 100): string {
    const trimmed = name.trim();
    const base = trimmed.replace(COPY_SUFFIX, '').trim() || trimmed;
    const taken = new Set(existing.map((n) => n.trim().toLowerCase()));

    for (let n = 1; ; n++) {
        const suffix = n === 1 ? ' (copy)' : ` (copy ${n})`;
        const room = Math.max(1, maxLength - suffix.length);
        const candidate = base.slice(0, room).trimEnd() + suffix;
        if (!taken.has(candidate.toLowerCase())) {
            return candidate;
        }
    }
}