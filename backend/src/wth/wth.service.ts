import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEMO_USER_ID } from '../users/users.service';
import { SaveWthGuideDto } from './save-wth-guide.dto';
import { checkWthEntries } from './wth-rules';

const guideInclude = {
    entries: {
        orderBy: { position: 'asc' },
        include: {
            targetCard: true,
            responses: { orderBy: { position: 'asc' }, include: { card: true } },
        },
    },
} satisfies Prisma.WthGuideInclude;

function emptyToNull(text: string | null | undefined): string | null {
    const trimmed = text?.trim() ?? '';
    return trimmed === '' ? null : trimmed;
}

@Injectable()
export class WthService {
    constructor(private readonly prisma: PrismaService) {}

    /** The list is light: no cards, only how many opponent cards each guide has. */
    findAll() {
        return this.prisma.wthGuide.findMany({
            where: { ownerId: DEMO_USER_ID },
            orderBy: { opponentDeckName: 'asc' },
            select: {
                id: true,
                opponentDeckName: true,
                notes: true,
                updatedAt: true,
                _count: { select: { entries: true } },
            },
        });
    }

    async findOne(id: string) {
        const guide = await this.prisma.wthGuide.findFirst({
            where: { id, ownerId: DEMO_USER_ID },
            include: guideInclude,
        });
        if (!guide) {
            throw new NotFoundException('WTH Guide not found');
        }
        return guide;
    }

    async create(dto: SaveWthGuideDto) {
        const name = await this.validate(dto);
        return this.prisma.wthGuide.create({
            data: {
                ownerId: DEMO_USER_ID,
                opponentDeckName: name,
                notes: emptyToNull(dto.notes),
                entries: { create: this.entriesData(dto) },
            },
            include: guideInclude,
        });
    }

    async update(id: string, dto: SaveWthGuideDto) {
        await this.findOne(id); // 404 if it is not ours
        const name = await this.validate(dto, id);
        // All or nothing: old rows out, new rows in
        const [, updated] = await this.prisma.$transaction([
            this.prisma.wthEntry.deleteMany({ where: { guideId: id } }),
            this.prisma.wthGuide.update({
                where: { id },
                data: {
                    opponentDeckName: name,
                    notes: emptyToNull(dto.notes),
                    entries: { create: this.entriesData(dto) },
                },
                include: guideInclude,
            }),
        ]);
        return updated;
    }

    async remove(id: string) {
        await this.findOne(id);
        await this.prisma.wthGuide.delete({ where: { id } });
    }

    private entriesData(dto: SaveWthGuideDto) {
        return dto.entries.map((entry, i) => ({
            targetCardId: entry.targetCardId,
            notes: emptyToNull(entry.notes),
            position: i,
            responses: {
                create: entry.responses.map((r, j) => ({ cardId: r.cardId, position: j })),
            },
        }));
    }

    /** Returns the trimmed name if everything is valid, otherwise throws. */
    private async validate(dto: SaveWthGuideDto, excludeId?: string) {
        const name = dto.opponentDeckName.trim();
        if (name === '') {
            throw new BadRequestException('The Opponent Deck Name is mandatory');
        }

        const ids = new Set<number>();
        for (const e of dto.entries) {
            ids.add(e.targetCardId);
            e.responses.forEach((r) => ids.add(r.cardId));
        }
        const cards = await this.prisma.card.findMany({
            where: { id: { in: [...ids] } },
            select: { id: true, name: true },
        });
        const names = new Map(cards.map((c) => [c.id, c.name]));
        const missing = [...ids].filter((id) => !names.has(id));
        if (missing.length > 0) {
            throw new BadRequestException(`Cards missing: ${missing.join(', ')}`);
        }

        const errors = checkWthEntries(dto.entries, names);
        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }

        const sameName = await this.prisma.wthGuide.findFirst({
            where: {
                ownerId: DEMO_USER_ID,
                opponentDeckName: { equals: name, mode: 'insensitive' },
                ...(excludeId ? { NOT: { id: excludeId } } : {}),
            },
            select: { id: true },
        });
        if (sameName) {
            throw new ConflictException(`Already existing guide for "${name}"`);
        }
        return name;
    }
}