import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEMO_USER_ID } from '../users/users.service';
import { SavePlaylistDto } from './save-playlist.dto';

const playlistInclude = {
    combos: {
        orderBy: { position: 'asc' },
        include: {
            combo: {
                select: { id: true, name: true, description: true, stepCount: true, updatedAt: true },
            },
        },
    },
} satisfies Prisma.PlaylistInclude;

@Injectable()
export class PlaylistsService {
    constructor(private readonly prisma: PrismaService) {}

    findAll() {
        return this.prisma.playlist.findMany({
            where: { ownerId: DEMO_USER_ID },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                description: true,
                updatedAt: true,
                _count: { select: { combos: true } },
            },
        });
    }

    async findOne(id: string) {
        const playlist = await this.prisma.playlist.findFirst({
            where: { id, ownerId: DEMO_USER_ID },
            include: playlistInclude,
        });
        if (!playlist) {
            throw new NotFoundException('Playlist not found');
        }
        return playlist;
    }

    async create(dto: SavePlaylistDto) {
        const name = await this.validate(dto);
        return this.prisma.playlist.create({
            data: {
                ownerId: DEMO_USER_ID,
                name,
                description: this.descriptionOf(dto),
                combos: { create: this.combosData(dto) },
            },
            include: playlistInclude,
        });
    }

    async update(id: string, dto: SavePlaylistDto) {
        await this.findOne(id); // 404 if it is not ours
        const name = await this.validate(dto, id);
        // All or nothing: old links out, new ones in (the order is the position)
        const [, updated] = await this.prisma.$transaction([
            this.prisma.playlistCombo.deleteMany({ where: { playlistId: id } }),
            this.prisma.playlist.update({
                where: { id },
                data: {
                    name,
                    description: this.descriptionOf(dto),
                    combos: { create: this.combosData(dto) },
                },
                include: playlistInclude,
            }),
        ]);
        return updated;
    }

    /** Deletes the playlist and its links: the combos are NOT deleted. */
    async remove(id: string) {
        await this.findOne(id);
        await this.prisma.playlist.delete({ where: { id } });
    }

    private combosData(dto: SavePlaylistDto) {
        return dto.comboIds.map((comboId, i) => ({ comboId, position: i }));
    }

    private descriptionOf(dto: SavePlaylistDto) {
        const description = dto.description?.trim() ?? '';
        return description === '' ? null : description;
    }

    /** Returns the trimmed name if everything is valid, otherwise throws. */
    private async validate(dto: SavePlaylistDto, excludeId?: string) {
        const name = dto.name.trim();
        if (name === '') {
            throw new BadRequestException('Playlist name is mandatory');
        }

        // Only the user's own combos can go into a playlist
        const found = await this.prisma.combo.findMany({
            where: { id: { in: dto.comboIds }, ownerId: DEMO_USER_ID },
            select: { id: true },
        });
        const known = new Set(found.map((c) => c.id));
        const missing = dto.comboIds.filter((id) => !known.has(id));
        if (missing.length > 0) {
            throw new BadRequestException(`Missing combos: ${missing.join(', ')}`);
        }

        const sameName = await this.prisma.playlist.findFirst({
            where: {
                ownerId: DEMO_USER_ID,
                name: { equals: name, mode: 'insensitive' },
                ...(excludeId ? { NOT: { id: excludeId } } : {}),
            },
            select: { id: true },
        });
        if (sameName) {
            throw new ConflictException(`Already existing playlist named "${name}"`);
        }
        return name;
    }
}