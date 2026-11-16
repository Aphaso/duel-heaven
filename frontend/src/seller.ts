export function sellerLabel(seller: string | null): string {
    return seller ? `@${seller}` : 'a deleted Duelist';
}