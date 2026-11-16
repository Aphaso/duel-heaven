import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { clampPage, normalizeStoreQuery, STORE_PAGE_SIZE, totalPagesFor } from './store-query';
import { contains } from 'class-validator';

@Injectable()
export class StoreService {
    constructor(private readonly prisma: PrismaService) {}

    /** Playlists for sale, newest first, filtered by playlist or seller name, one page at a time */
    async list(userId: string, rawQ: unknown, rawPage: unknown) {
        const { q, page: requestedPage } = normalizeStoreQuery(rawQ, rawPage);

        // Search in the playlist name or in the seller's username, case insenstive
        const search =
            q === ''
                ? {}
                : {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' as const } },
                        { owner: { username: { contains: q, mode: 'insensitive' as const } } },
                    ],
                };
        const where = { isForSale: true, deletedAt: null, ...search };

        const total = await this.prisma.playlist.count({ where });
        const totalPages = totalPagesFor(total);
        const page = clampPage(requestedPage, totalPages);

        const playlists = await this.prisma.playlist.findMany({
            where,
            // id serves as a tiebreaker in the order
            orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
            skip: (page - 1) * STORE_PAGE_SIZE,
            take: STORE_PAGE_SIZE,
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

        return {
            items: playlists.map((p) => ({
                id: p.id,
                name: p.name,
                description: p.description,
                priceCents: p.priceCents,
                updatedAt: p.updatedAt,
                seller: p.owner?.username ?? null,
                comboCount: p._count.combos,
                isOwn: p.ownerId === userId,
                purchased: p.purchases.length > 0,
            })),
            total,
            page,
            limit: STORE_PAGE_SIZE,
            totalPages,
        };
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
            seller: p.owner?.username ?? null,
            combos: p.combos.map((c) => c.combo),
            isOwn: p.ownerId === userId,
            purchased: p.purchases.length > 0,
        };
    }
}