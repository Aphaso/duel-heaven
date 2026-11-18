// All the measures are in millimetres. The origin is the top-left corner of the page.

export interface Size {
    width: number;
    height: number;
}

export const A4_MM: Size = { width: 210, height: 297 };
export const PROXY_CARD_MM: Size = { width: 59, height: 86 };
// Space between two cards, so they can be cut out easily
export const PROXY_GAP_MM = 2;
// Minimum margin since most printers cannot print right up to the edge of the paper
export const MIN_MARGIN_MM = 5;

export interface ProxyGrid {
    columns: number;
    rows: number;
    perPage: number;
    // Where the top-left card starts: the grid is centered on the page
    originX: number;
    originY: number;
}

/** How many cards fit on a page, and where the grid starts. */
export function proxyGrid(
    page: Size = A4_MM,
    card: Size = PROXY_CARD_MM,
    gap: number = PROXY_GAP_MM,
    margin: number = MIN_MARGIN_MM,
): ProxyGrid {
    // n cards need n * size + (n - 1) * gap: that is why the gap is added to the available space
    const fit = (available: number, size: number) => Math.max(0, Math.floor((available - 2 * margin + gap) / (size + gap)));
    const columns = fit(page.width, card.width);
    const rows = fit(page.height, card.height);
    if (columns === 0 || rows === 0) {
        throw new Error('The card does not fit on the page');
    }
    const usedWidth = columns * card.width + (columns - 1) * gap;
    const usedHeight = rows * card.height + (rows - 1) * gap;
    return {
        columns,
        rows,
        perPage: columns * rows,
        originX: (page.width - usedWidth) / 2,
        originY: (page.height - usedHeight) / 2,
    };
}

export interface Placement {
    // 0-based
    page: number;
    x: number;
    y: number;
}

/** The place of every card, in order: left to right, then top to bottom, then the next page. */
export function placements(
    count: number,
    grid: ProxyGrid = proxyGrid(),
    card: Size = PROXY_CARD_MM,
    gap: number = PROXY_GAP_MM,
): Placement[] {
    const result: Placement[] = [];
    for (let i = 0; i < count; i++) {
        const slot = i % grid.perPage;
        result.push({
            page: Math.floor(i / grid.perPage),
            x: grid.originX + (slot % grid.columns) * (card.width + gap),
            y: grid.originY + Math.floor(slot / grid.columns) * (card.height + gap),
        });
    }
    return result;
}

export function pageCount(count: number, grid: ProxyGrid = proxyGrid()): number {
    return Math.ceil(count / grid.perPage);
}

export interface ProxyRequestRow {
    cardId: number;
    quantity: number;
}

/** [{cardId: 7, quantity: 2}] becomes [7, 7]: this way we can save one entry per printed card instead of one entry per copy */
export function expandRows(rows: ProxyRequestRow[]): number[] {
    return rows.flatMap((r) => Array<number>(r.quantity).fill(r.cardId));
}