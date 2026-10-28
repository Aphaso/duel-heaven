import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DeckSection } from '../generated/prisma/enums';
import { DEMO_USER_ID } from '../users/users.service';
import { CreateDeckDto } from './create-deck.dto';
import { UpdateDeckDto } from './update-deck.dto';
import { SetDeckCardDto } from './set-deck-card.dto';
import { analyzeDeck, checkChange } from './deck-rules';

@Injectable()
export class DecksService {
    constructor(private readonly prisma: PrismaService) {}

    findAll() {
        return this.prisma.deck.findMany({
            where: { ownerId: DEMO_USER_ID },
            orderBy: { updatedAt: 'desc'},
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
            },
        });
        if (!deck) {
            throw new NotFoundException(`Deck ${id} not found`);
        }
        return { ...deck, summary: analyzeDeck(deck.cards) };
    }

    create(dto: CreateDeckDto) {
        return this.prisma.deck.create({
            data: { ...dto, ownerId: DEMO_USER_ID },
        });
    }

    async update(id: string, dto: UpdateDeckDto) {
        await this.assertOwned(id);
        return this.prisma.deck.update({ where: { id }, data: dto });
    }

    async remove(id: string) {
        await this.assertOwned(id);
        await this.prisma.deck.delete({ where: { id } });
    }

    // Sets the quantity of a card in a section, creating it if it doesn't exist.
    async setCard(deckId: string, dto: SetDeckCardDto) {
        await this.assertOwned(deckId);

        const card = await this.prisma.card.findUnique({
            where: { id: dto.cardId },
            select: { id: true, name: true },
        });
        if (!card) {
            throw new NotFoundException(`Card ${dto.cardId} not found`);
        }

        const entries = await this.prisma.deckCard.findMany({
            where: { deckId },
            select: { cardId: true, section: true, quantity: true },
        });

        const errors = checkChange(entries, dto, card.name);
        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }

        await this.prisma.deckCard.upsert({
            where: {
                deckId_cardId_section: {
                    deckId,
                    cardId: dto.cardId,
                    section: dto.section,
                },
            },
            update: { quantity: dto.quantity },
            create: {
                deckId,
                cardId: dto.cardId,
                section: dto.section,
                quantity: dto.quantity,
            },
        });

        return this.findOne(deckId);
    }

    // Fully removes a card from a section. If the card wasn't originally in the section, it does nothing.
    async removeCard(deckId: string, cardId: number, section: DeckSection) {
        await this.assertOwned(deckId);
        await this.prisma.deckCard.deleteMany({
            where: { deckId, cardId, section },
        });
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