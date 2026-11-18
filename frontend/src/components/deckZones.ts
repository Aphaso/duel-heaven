import type { DeckSection } from '../types';

/** Colors of the three deck zones (Main = aether, Extra = arcane, Side = relic). */
export const ZONE_STYLES: Record<DeckSection, { text: string; bar: string; dot: string; border: string }> = {
    MAIN: { text: 'text-zone-main', bar: 'bg-zone-main', dot: 'bg-zone-main shadow-glow-primary', border: 'border-l-zone-main' },
    EXTRA: { text: 'text-zone-extra', bar: 'bg-zone-extra', dot: 'bg-zone-extra shadow-glow-secondary', border: 'border-l-zone-extra' },
    SIDE: { text: 'text-zone-side', bar: 'bg-zone-side', dot: 'bg-zone-side shadow-glow-accent', border: 'border-l-zone-side' },
};
