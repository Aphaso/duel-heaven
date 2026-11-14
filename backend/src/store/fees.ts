/** What the platform keeps on every sale */
export const PLATFORM_FEE_PERCENT = 10;

export function platformFeeCents(priceCents: number): number {
    return Math.round((priceCents * PLATFORM_FEE_PERCENT) / 100);
}