import type { Card } from '../types';

/**
 * Colors of the card frames and attributes, from the theme tokens.
 * Full class names are written out so that Tailwind can find them.
 */

const FRAME_BG: Record<string, string> = {
    normal: 'bg-frame-normal',
    effect: 'bg-frame-effect',
    ritual: 'bg-frame-ritual',
    fusion: 'bg-frame-fusion',
    synchro: 'bg-frame-synchro',
    xyz: 'bg-frame-xyz',
    link: 'bg-frame-link',
    spell: 'bg-frame-spell',
    trap: 'bg-frame-trap',
    token: 'bg-frame-token',
    skill: 'bg-frame-skill',
};

const FRAME_TEXT: Record<string, string> = {
    normal: 'text-frame-normal',
    effect: 'text-frame-effect',
    ritual: 'text-frame-ritual',
    fusion: 'text-frame-fusion',
    synchro: 'text-frame-synchro',
    xyz: 'text-night-200',
    link: 'text-frame-link',
    spell: 'text-frame-spell',
    trap: 'text-frame-trap',
    token: 'text-frame-token',
    skill: 'text-frame-skill',
};

const ATTRIBUTE: Record<string, string> = {
    DARK: 'border-attr-dark/50 bg-attr-dark/15 text-attr-dark',
    LIGHT: 'border-attr-light/50 bg-attr-light/15 text-attr-light',
    EARTH: 'border-attr-earth/50 bg-attr-earth/15 text-attr-earth',
    WATER: 'border-attr-water/50 bg-attr-water/15 text-attr-water',
    FIRE: 'border-attr-fire/50 bg-attr-fire/15 text-attr-fire',
    WIND: 'border-attr-wind/50 bg-attr-wind/15 text-attr-wind',
    DIVINE: 'border-attr-divine/50 bg-attr-divine/15 text-attr-divine',
};

/** "effect_pendulum" → { base: "effect", pendulum: true } */
function parseFrame(frameType: string | null) {
    const frame = frameType ?? '';
    const pendulum = frame.endsWith('_pendulum');
    return { base: pendulum ? frame.replace('_pendulum', '') : frame, pendulum };
}

/** Background with the color of the card frame (Pendulum: half and half). */
export function frameBgClass(card: Card): string {
    const { base, pendulum } = parseFrame(card.frameType);
    if (pendulum) {
        return 'bg-frame-pendulum';
    }
    return FRAME_BG[base] ?? 'bg-frame-token';
}

/** Text color of the card frame, readable on the dark theme. */
export function frameTextClass(card: Card): string {
    return FRAME_TEXT[parseFrame(card.frameType).base] ?? 'text-ink-subtle';
}

export function attributeClass(attribute: string): string {
    return ATTRIBUTE[attribute.toUpperCase()] ?? 'border-line-strong bg-surface-overlay text-ink-muted';
}

export function isMonster(card: Card): boolean {
    return card.atk !== null || card.def !== null || card.level !== null;
}

/** Name of the "level" value: Level, Rank (Xyz) or Link. */
export function levelLabel(card: Card): string {
    const { base } = parseFrame(card.frameType);
    if (base === 'xyz') {
        return 'Rank';
    }
    if (base === 'link') {
        return 'Link';
    }
    return 'Level';
}
