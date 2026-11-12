import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { replay, type ComboCardEntry } from './combo-engine';
import { checkComboCards, type ComboCardInfo } from './combo-rules';
import { SaveComboDto } from './save-combo.dto';

const comboInclude = {
    cards: { orderBy: { position: 'asc' }, include: { card: true } },
} satisfies Prisma.ComboInclude;

@Injectable()
export class CombosService {
    constructor(private readonly prisma: PrismaService) {}

    findAll(userId: string) {
        return this.prisma.combo.findMany({
            where: { ownerId: userId },
            orderBy: { updatedAt: 'desc' },
            select: { id: true, name: true, description: true, stepCount: true, updatedAt: true },
        });
    }

    async findOne(userId: string, id: string) {
        const combo = await this.prisma.combo.findFirst({
            where: { id, ownerId: userId },
            include: comboInclude,
        });
        if (!combo) {
            throw new NotFoundException('Combo not found');
        }
        return combo;
    }

    async create(userId: string, dto: SaveComboDto) {
        const valid = await this.validate(dto);
        return this.prisma.combo.create({
            data: {
                ownerId: userId,
                name: valid.name,
                description: valid.description,
                startingHand: dto.startingHand,
                steps: valid.steps as unknown as Prisma.InputJsonValue,
                stepCount: valid.steps.length,
                cards: { create: this.cardsData(dto) },
            },
            include: comboInclude,
        });
    }

    async update(userId: string, id: string, dto: SaveComboDto) {
        await this.findOne(userId, id); // 404 if it is not ours
        const valid = await this.validate(dto);
        // All or nothing: old decklist out, new one in
        const [, updated] = await this.prisma.$transaction([
            this.prisma.comboCard.deleteMany({ where: { comboId: id } }),
            this.prisma.combo.update({
                where: { id },
                data: {
                    name: valid.name,
                    description: valid.description,
                    startingHand: dto.startingHand,
                    steps: valid.steps as unknown as Prisma.InputJsonValue,
                    stepCount: valid.steps.length,
                    cards: { create: this.cardsData(dto) },
                },
                include: comboInclude,
            }),
        ]);
        return updated;
    }

    async remove(userId: string, id: string) {
        await this.findOne(userId, id);
        await this.prisma.combo.delete({ where: { id } });
    }

    private cardsData(dto: SaveComboDto) {
        return dto.cards.map((c, i) => ({
            cardId: c.cardId,
            section: c.section,
            quantity: c.quantity,
            position: i,
        }));
    }

    /** Checks decklist, starting hand and EVERY step by replaying the combo. */
    private async validate(dto: SaveComboDto) {
        const name = dto.name.trim();
        if (name === '') {
            throw new BadRequestException('Combo Name is mandatory');
        }

        const ids = [...new Set(dto.cards.map((c) => c.cardId))];
        const found = await this.prisma.card.findMany({
            where: { id: { in: ids } },
            select: { id: true, name: true, frameType: true },
        });
        const info = new Map<number, ComboCardInfo>(found.map((c) => [c.id, c]));
        const missing = ids.filter((id) => !info.has(id));
        if (missing.length > 0) {
            throw new BadRequestException(`Missing Cards: ${missing.join(', ')}`);
        }

        const entries: ComboCardEntry[] = dto.cards.map((c) => ({
            cardId: c.cardId,
            section: c.section,
            quantity: c.quantity,
        }));
        const deckErrors = checkComboCards(entries, info);
        if (deckErrors.length > 0) {
            throw new BadRequestException(deckErrors);
        }

        const result = replay(entries, dto.startingHand, dto.steps);
        if (result.errors.length > 0) {
            throw new BadRequestException(result.errors);
        }

        const description = dto.description?.trim() ?? '';
        return {
            name,
            description: description === '' ? null : description,
            // The normalized steps (notes trimmed), not the raw input
            steps: result.steps,
        };
    }
}