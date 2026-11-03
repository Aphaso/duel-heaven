import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEMO_USER_ID } from '../users/users.service';
import { CreateDeckDto } from './create-deck.dto';
import { SaveDeckListDto } from './save-deck-list.dto';
import { UpdateDeckDto } from './update-deck.dto';
import { analyzeDeck, checkDeckList } from './deck-rules';

@Injectable()
export class DecksService {
    constructor(private readonly prisma: PrismaService) {}

    findAll() {
        return this.prisma.deck.findMany({
            where: { ownerId: DEMO_USER_ID },
            orderBy: { updatedAt: 'desc' }
        });
    }

    async findOne(id: string) {
        const deck = await this.prisma.deck.findFirst({
            where: { id, ownerId: DEMO_USER_ID },
            include: {
                cards: {
                    include: { card: true },
                    orderBy: [{ section: 'asc' }, { card: { name: 'asc' } }],
                },
            }
        });
        if (!deck) {
            throw new NotFoundException(`Deck ${id} not found`);
        }
        return { ...deck, summary: analyzeDeck(deck.cards) };
    }

    create(dto: CreateDeckDto) {
        return this.prisma.deck.create({
            data: { ...dto, ownerId: DEMO_USER_ID }
        });
    }

    async update(id: string, dto: UpdateDeckDto) {
        await this.assertOwned(id);
        await this.prisma.deck.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        await this.assertOwned(id);
        await this.prisma.deck.delete({ where: { id } });
    }

    async saveList(deckId: string, dto: SaveDeckListDto) {
        await this.assertOwned(deckId);

        const cardIds = [...new Set(dto.cards.map((c) => c.cardId))];
        const found = await this.prisma.card.findMany({
            where: { id: { in: cardIds } },
            select: { id: true, name: true, frameType: true }
        });
        const cards = new Map(found.map((c) => [c.id, c]));

        const unknown = cardIds.filter((id) => !cards.has(id));
        if (unknown.length > 0) {
            throw new BadRequestException(`Cards not found: ${unknown.join(', ')}`);
        }

        const errors = checkDeckList(dto.cards, cards);
        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }

        await this.prisma.$transaction([
            this.prisma.deckCard.deleteMany({ where: { deckId } }),
            this.prisma.deckCard.createMany({
                data: dto.cards.map((c) => ({
                    deckId,
                    cardId: c.cardId,
                    section: c.section,
                    quantity: c.quantity,
                })),
            }),
            this.prisma.deck.update({
                where: { id: deckId },
                data: { updatedAt: new Date() },
            }),
        ]);

        return this.findOne(deckId);
    }

    private async assertOwned(id: string) {
        const deck = await this.prisma.deck.findFirst({
            where: { id, ownerId: DEMO_USER_ID },
            select: { id: true },
        });
        if (!deck) {
            throw new NotFoundException(`Deck ${id} not found`);
        }
    }
}