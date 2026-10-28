import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DEMO_USER_ID } from '../users/users.service';
import { CreateDeckDto } from './create-deck.dto';
import { UpdateDeckDto } from './update-deck.dto';

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
        return deck;
    }

    create(dto: CreateDeckDto) {
        return this.prisma.deck.create({
            data: { ...dto, ownerId: DEMO_USER_ID },
        });
    }

    async update(id: string, dto: UpdateDeckDto) {
        await this.assertOwned(id);
        return this.prisma.deck.update({ where: { id }, data: dto});
    }

    async remove(id: string) {
        await this.assertOwned(id);
        await this.prisma.deck.delete({ where: { id } });
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