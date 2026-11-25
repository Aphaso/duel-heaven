import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CardsService {
    constructor(private readonly prisma: PrismaService){}

    async search(params: { search?: string; page: number; limit: number }) {
        const { search, page, limit } = params;

        const where : Prisma.CardWhereInput = search
        ? { name: { contains: search, mode: 'insensitive' } }
        : {};

        const [items, total] = await this.prisma.$transaction([
            this.prisma.card.findMany({
                where,
                orderBy: { name: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.card.count({ where }),
        ]);

        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findOne(id: number) {
        const card = await this.prisma.card.findUnique({ where: { id } });
        if (!card) {
            throw new NotFoundException(`Card ${id} not found`);
        }
        return card;
    }
}