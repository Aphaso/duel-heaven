import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoreService {
    constructor(private readonly prisma: PrismaService) {}

    /** Playlists for sale, newest first */
    async list(userId: string) {
        const playlists = await this.prisma.playlist.findMany({
            where: { isForSale: true, deletedAt: null },
            orderBy: { updatedAt: 'desc' },
            take: 100,
            select: {
                id: true,
                name: true,
                description: true,
                priceCents: true,
                updatedAt: true,
                ownerId: true,
                owner: { select: { username: true } },
                _count: { select: { combos: true } },
                purchases: { where: { buyerId: userId }, select: { id: true } },
            },
        });
        return playlists.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            priceCents: p.priceCents,
            updatedAt: p.updatedAt,
            seller: p.owner.username,
            comboCount: p._count.combos,
            isOwn: p.ownerId === userId,
            purchased: p.purchases.length > 0,
        }));
    }

    /** Preview before buying: names and sizes but not the content of the combos */
    async detail(userId: string, id: string) {
        const p = await this.prisma.playlist.findFirst({
            where: { id, isForSale: true, deletedAt: null },
            select: {
                id: true,
                name: true,
                description: true,
                priceCents: true,
                updatedAt: true,
                ownerId: true,
                owner: { select: { username: true } },
                combos: {
                    orderBy: { position: 'asc' },
                    select: { combo: { select: { name: true, stepCount: true } } },
                },
                purchases: { where: { buyerId: userId }, select: { id: true } },
            }
        });
        if (!p) {
            throw new NotFoundException('Playlist not found');
        }
        return {
            id: p.id,
            name: p.name,
            description: p.description,
            priceCents: p.priceCents,
            updatedAt: p.updatedAt,
            seller: p.owner.username,
            combos: p.combos.map((c) => c.combo),
            isOwn: p.ownerId === userId,
            purchased: p.purchases.length > 0,
        };
    }
}