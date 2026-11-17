import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConnectService } from '../connect/connect.service';
import { SavePlaylistDto } from './save-playlist.dto';
import { buildPlaylistSnapshot } from './playlist-snapshot';
import { sameIds } from './playlist-order';

export const PRICE_MIN_CENTS = 50;
export const PRICE_MAX_CENTS = 50_000;

const playlistInclude = {
    combos: {
        orderBy: { position: 'asc' },
        include: {
            combo: {
                select: { id: true, name: true, description: true, stepCount: true, updatedAt: true },
            },
        },
    },
    _count: { select: { purchases: true } },
} satisfies Prisma.PlaylistInclude;

@Injectable()
export class PlaylistsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly connect: ConnectService,
    ) {}

    findAll(userId: string) {
        return this.prisma.playlist.findMany({
            where: { ownerId: userId, deletedAt: null },
            orderBy: [{ position: 'asc' }, { name: 'asc' }],
            select: {
                id: true,
                name: true,
                description: true,
                updatedAt: true,
                isForSale: true,
                priceCents: true,
                _count: { select: { combos: true, purchases: true } },
            },
        });
    }

    async findOne(userId: string, id: string) {
        const playlist = await this.prisma.playlist.findFirst({
            where: { id, ownerId: userId, deletedAt: null },
            include: playlistInclude,
        });
        if (!playlist) {
            throw new NotFoundException('Playlist not found');
        }
        return playlist;
    }

    async create(userId: string, dto: SavePlaylistDto) {
        const name = await this.validate(userId, dto);
        const last = await this.prisma.playlist.aggregate({
            where: { ownerId: userId, deletedAt: null },
            _max: { position: true },
        });
        return this.prisma.playlist.create({
            data: {
                ownerId: userId,
                name,
                position: (last._max.position ?? -1) + 1,
                description: this.descriptionOf(dto),
                ...this.saleOf(dto),
                combos: { create: this.combosData(dto) },
            },
            include: playlistInclude,
        });
    }

    async update(userId: string, id: string, dto: SavePlaylistDto) {
        await this.findOne(userId, id); // 404 if it is not ours or it was deleted
        const name = await this.validate(userId, dto, id);
        // All or nothing: old links out, new ones in (the order is the position)
        const [, updated] = await this.prisma.$transaction([
            this.prisma.playlistCombo.deleteMany({ where: { playlistId: id } }),
            this.prisma.playlist.update({
                where: { id },
                data: {
                    name,
                    description: this.descriptionOf(dto),
                    ...this.saleOf(dto),
                    combos: { create: this.combosData(dto) },
                },
                include: playlistInclude,
            }),
        ]);
        return updated;
    }

    /** 
     * Deletes the playlist. The combos are not deleted.
     * - Nobody bought it: real deletion.
     * - Someone bought it: the buyers must keep what they paid for, so we take a snapshot
     *   of the playlist and its combos and only hide the playlist from the seller.
     *   (The database also refuses to really delete a playlist with purchases)
     */
    async remove(userId: string, id: string) {
        await this.findOne(userId, id);
        
        const purchases = await this.prisma.purchase.count({ where: { playlistId: id} });
        if (purchases === 0) {
            await this.prisma.playlist.delete({ where: { id } });
            return;
        }

        const snapshot = await buildPlaylistSnapshot(this.prisma, id);
        await this.prisma.$transaction([
            this.prisma.playlistCombo.deleteMany({ where: { playlistId: id } }),
            this.prisma.playlist.update({
                where: { id },
                data: { deletedAt: new Date(), isForSale: false, snapshot },
            }),
        ]);
    }

    /**
     * Saves the order of the user's list.
     * ids must be exactly the user's playlists: if the list changed in the meantime
     * (another tab, another device) nothing is saved.
     */
    async reorder(userId: string, ids: string[]) {
        const mine = await this.prisma.playlist.findMany({
            where: { ownerId: userId, deletedAt: null },
            select: { id: true, updatedAt: true },
        });
        if (!sameIds(mine.map((p) => p.id), ids)) {
            throw new ConflictException('Your playlists changed: reload the page and try again');
        }
        const updatedAt = new Map(mine.map((p) => [p.id, p.updatedAt]));
        // updatedAt is written back as it was: moving a playlist is not editing it,
        // and the Store lists the newest first
        await this.prisma.$transaction(
            ids.map((id, position) => this.prisma.playlist.update({
                where: { id },
                data: { position, updatedAt: updatedAt.get(id) },
            })),
        );
    }

    private combosData(dto: SavePlaylistDto) {
        return dto.comboIds.map((comboId, i) => ({ comboId, position: i }));
    }

    private descriptionOf(dto: SavePlaylistDto) {
        const description = dto.description?.trim() ?? '';
        return description === '' ? null : description;
    }

    /**
     * - Not for sale = no price.
     * - For sale = the already validated price.
     */
    private saleOf(dto: SavePlaylistDto) {
        const isForSale = dto.isForSale === true;
        return { isForSale, priceCents: isForSale ? (dto.priceCents ?? null) : null };
    }

    /** Returns the trimmed name if everything is valid, otherwise throws. */
    private async validate(userId: string, dto: SavePlaylistDto, excludeId?: string) {
        const name = dto.name.trim();
        if (name === '') {
            throw new BadRequestException('Playlist name is mandatory');
        }

        if (dto.isForSale) {
            if (dto.comboIds.length === 0) {
                throw new BadRequestException('A playlist for sale must contain at least one combo');
            }
            const price = dto.priceCents;
            if (
                price === undefined ||
                price === null ||
                !Number.isInteger(price) ||
                price < PRICE_MIN_CENTS ||
                price > PRICE_MAX_CENTS
            ) {
                throw new BadRequestException(`The price must be between ${PRICE_MIN_CENTS / 100} and ${PRICE_MAX_CENTS / 100} EUR`);
            }
            await this.connect.assertCanSell(userId);
        }

        // Only the user's own combos can go into a playlist
        const found = await this.prisma.combo.findMany({
            where: { id: { in: dto.comboIds }, ownerId: userId },
            select: { id: true },
        });
        const known = new Set(found.map((c) => c.id));
        const missing = dto.comboIds.filter((id) => !known.has(id));
        if (missing.length > 0) {
            throw new BadRequestException(`Missing combos: ${missing.join(', ')}`);
        }

        // Deleted playlists don't count, so their name is free again
        const sameName = await this.prisma.playlist.findFirst({
            where: {
                ownerId: userId,
                deletedAt: null,
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