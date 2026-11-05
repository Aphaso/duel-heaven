import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { DeckEntry } from '../decks/deck-rules';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEMO_USER_ID } from '../users/users.service';
import { SaveSidePatternDto } from './save-side-pattern.dto';
import { checkSidePattern } from './side-pattern-rules';

const WITH_CARDS = {
    cards: {
        include: { card: true },
        orderBy: [{ position: 'asc' }],
    },
} satisfies Prisma.SidePatternInclude;

type PatternWithCards = Prisma.SidePatternGetPayload<{
    include: typeof WITH_CARDS;
}>;

/** Shapes a database row for the API */
function format(pattern: PatternWithCards, deckEntries: DeckEntry[]) {
    const { cards, ...rest } = pattern;
    const cardsOut = cards.filter((c) => c.direction === 'OUT');
    const cardsIn = cards.filter((c) => c.direction === 'IN');
    const info = new Map(cards.map((c) => [c.cardId, c.card]));
    return {
        ...rest,
        cardsOut,
        cardsIn,
        issues: checkSidePattern(cardsOut, cardsIn, deckEntries, info),
    };
}

@Injectable()
export class SidePatternsService {
    constructor(private readonly prisma: PrismaService) {}

    async list(deckId: string) {
        const deckEntries = await this.loadDeckEntries(deckId);
        const patterns = await this.prisma.sidePattern.findMany({
            where: { deckId },
            orderBy: { opponentDeckName: 'asc' },
            include: WITH_CARDS,
        });
        return patterns.map((p) => format(p, deckEntries));
    }

    async create(deckId: string, dto: SaveSidePatternDto) {
        const deckEntries = await this.validate(deckId, dto);
        const created = await this.prisma.sidePattern.create({
            data: {
                deckId,
                opponentDeckName: dto.opponentDeckName,
                notes: dto.notes ?? null,
                cards: { create: this.toRows(dto) },
            },
            include: WITH_CARDS,
        });
        return format(created, deckEntries);
    }

    /** Replaces the whole pattern */
    async update(deckId: string, id: string, dto: SaveSidePatternDto) {
        await this.assertPatternOwned(deckId, id);
        const deckEntries = await this.validate(deckId, dto, id);
        const [, updated] = await this.prisma.$transaction([
            this.prisma.sidePatternCard.deleteMany({
                where: { sidePatternId: id },
            }),
            this.prisma.sidePattern.update({
                where: { id },
                data: {
                    opponentDeckName: dto.opponentDeckName,
                    notes: dto.notes ?? null,
                    cards: { create: this.toRows(dto) },
                },
                include: WITH_CARDS,
            }),
        ]);
        return format(updated, deckEntries);
    }

    async remove(deckId: string, id: string) {
        await this.assertPatternOwned(deckId, id);
        await this.prisma.sidePattern.delete({ where: { id } });
    }

    /** The cards of the saved deck, or 404 if the deck doesn't belong to the user or doesn't exist */
    private async loadDeckEntries(deckId: string): Promise<DeckEntry[]> {
        const deck = await this.prisma.deck.findFirst({
            where: { id: deckId, ownerId: DEMO_USER_ID },
            select: {
                cards: { select: { cardId: true, section: true, quantity: true } },
            },
        });
        if (!deck) {
            throw new NotFoundException(`Deck ${deckId} not found`);
        }
        return deck.cards;
    }

    /** Runs every check before anything is written. Returns the deck cards it loaded */
    private async validate(
        deckId: string,
        dto: SaveSidePatternDto,
        ignorePatternId?: string,
    ) {
        const deckEntries = await this.loadDeckEntries(deckId);

        const cardIds = [
            ...new Set([...dto.cardsOut, ...dto.cardsIn].map((c) => c.cardId)),
        ];
        const found = await this.prisma.card.findMany({
            where: { id: { in: cardIds } },
            select: { id: true, name: true, frameType: true },
        });
        const cards = new Map(found.map((c) => [c.id, c]));

        const unknown = cardIds.filter((id) => !cards.has(id));
        if (unknown.length > 0) {
            throw new BadRequestException(`Cards not found: ${unknown.join(', ')}`);
        }

        const errors = checkSidePattern(dto.cardsOut, dto.cardsIn, deckEntries, cards);
        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }

        // Same opponent name twice in one deck, ignoring upper/lower case
        const duplicate = await this.prisma.sidePattern.findFirst({
            where: {
                deckId,
                opponentDeckName: {
                    equals: dto.opponentDeckName,
                    mode: 'insensitive',
                },
                ...(ignorePatternId ? { NOT: { id: ignorePatternId } } : {}),
            },
            select: { id: true },
        });
        if (duplicate) {
            throw new ConflictException(`You already have a side pattern against "${dto.opponentDeckName}" for this Deck.`);
        }

        return deckEntries;
    }

    /** One database row per entry; the position is the index inside its own list */
    private toRows(dto: SaveSidePatternDto) {
        return [
            ...dto.cardsOut.map((c, i) => ({
                cardId: c.cardId,
                direction: 'OUT' as const,
                quantity: c.quantity,
                position: i,
            })),
            ...dto.cardsIn.map((c, i) => ({
                cardId: c.cardId,
                direction: 'IN' as const,
                quantity: c.quantity,
                position: i,
            })),
        ];
    }

    /** 404 if the pattern doesn't exist, is in another Deck or the Deck doesn't belong to the user */
    private async assertPatternOwned(deckId: string, id: string) {
        const pattern = await this.prisma.sidePattern.findFirst({
            where: { id, deckId, deck: { ownerId: DEMO_USER_ID } },
            select: { id: true },
        });
        if (!pattern) {
            throw new NotFoundException(`Side Pattern ${id} not found`);
        }
    }
}
