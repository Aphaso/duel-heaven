export const PRICE_MIN_CENTS = 50;
export const PRICE_MAX_CENTS = 50_000;

/** We do not use floating point */
export function parsePriceToCents(text: string): number | null {
    const clean = text.trim().replace(',', '.');
    const match = /^(\d{1,5})(?:\.(\d{1,2}))?$/.exec(clean);
    if (!match) {
        return null;
    }
    const euros = Number(match[1]);
    const cents = Number((match[2] ?? '').padEnd(2, '0'));
    return euros * 100 + cents;
}

/** What goes into the price field: change cents back into normal formatted price */
export function centsToInput(cents: number): string {
    const euros = Math.floor(cents / 100);
    const rest = String(cents % 100).padStart(2, '0');
    return `${euros}.${rest}`;
}

/** What is wrong with a price in cents, or null if it is fine */
export function priceProblem(cents: number | null): string | null {
    if (cents === null) {
        return 'Enter a valid price (e.g. 4.99)'
    }
    if (cents < PRICE_MIN_CENTS || cents > PRICE_MAX_CENTS) {
        return `The price must be between ${PRICE_MIN_CENTS / 100} and ${PRICE_MAX_CENTS / 100} EUR`;
    }
    return null;
}

/** Price formatting */
export function formatPrice(cents: number, currency = 'eur'): string {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(cents / 100);
}