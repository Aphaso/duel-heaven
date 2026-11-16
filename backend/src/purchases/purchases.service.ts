import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// The combo as it is stored inside a snapshot
type SnapshotCombo = {
    id: string;
    name: string;
    description: string | null;
    stepCount: number;
    updatedAt: string;
    [key: string]: unknown;
};
type PlaylistSnapshot = { name: string; description: string | null; combos: SnapshotCombo[] };

const comboInclude = {
    cards: { orderBy: { position: 'asc' }, include: { card: true } },
} satisfies Prisma.ComboInclude;

function readSnapshot(value: Prisma.JsonValue | null): PlaylistSnapshot {
    if (value && typeof value === 'object' && !Array.isArray(value) && Array.isArray(value.combos)) {
        return value as unknown as PlaylistSnapshot;
    }
    throw new NotFoundException('Playlist content is not available');
}

function comboSummary(c: SnapshotCombo) {
    return {
        id: c.id,
        name: c.name,
        description: c.description,
        stepCount: c.stepCount,
        updatedAt: c.updatedAt,
    };
}

@Injectable()
export class PurchasesService {
    constructor(private readonly prisma: PrismaService) {}

    /** The playlists the user bought, newest purchase first */
    async list(userId: string) {
        const purchases = await this.prisma.purchase.findMany({
            where: { buyerId: userId },
            orderBy: { createdAt: 'desc' },
            select: {
                createdAt: true,
                amountCents: true,
                currency: true,
                playlist: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        deletedAt: true,
                        snapshot: true,
                        owner: { select: { username: true } },
                        _count: { select: { combos: true } },
                    },
                },
            },
        });

        return purchases.map((p) => {
            const archived = p.playlist.deletedAt !== null;
            return {
                playlistId: p.playlist.id,
                name: p.playlist.name,
                description: p.playlist.description,
                seller: p.playlist.owner?.username ?? null,
                // After the seller deleted it, the combos are counted in the snapshot
                comboCount: archived
                    ? readSnapshot(p.playlist.snapshot).combos.length
                    : p.playlist._count.combos,
                archived,
                purchasedAt: p.createdAt,
                amountCents: p.amountCents,
                currency: p.currency,
            };
        });
    }

    /** One purchased playlist with its combos, name and size only */
    async detail(userId: string, playlistId: string) {
        const purchase = await this.prisma.purchase.findUnique({
            where: { buyerId_playlistId: { buyerId: userId, playlistId } },
            select: {
                createdAt: true,
                amountCents: true,
                currency: true,
                playlist: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        deletedAt: true,
                        snapshot: true,
                        owner: { select: { username: true } },
                        combos: {
                            orderBy: { position: 'asc' },
                            select: {
                                combo: {
                                    select: {
                                        id: true,
                                        name: true,
                                        description: true,
                                        stepCount: true,
                                        updatedAt: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!purchase) {
            throw new NotFoundException('Purchase not found');
        }

        const p = purchase.playlist;
        const archived = p.deletedAt !== null;
        const combos = archived
            ? readSnapshot(p.snapshot).combos.map(comboSummary)
            : p.combos.map((c) => c.combo);
        
        return {
            playlistId: p.id,
            name: p.name,
            description: p.description,
            seller: p.owner?.username ?? null,
            archived,
            purchasedAt: purchase.createdAt,
            amountCents: purchase.amountCents,
            currency: purchase.currency,
            combos,
        };
    }

    /** One full combo of a purchased playlist, same shape as GET /combos/:id */
    async combo(userId: string, playlistId: string, comboId: string) {
        const purchase = await this.prisma.purchase.findUnique({
            where: { buyerId_playlistId: { buyerId: userId, playlistId } },
            select: { playlist: { select: { deletedAt: true, snapshot: true } } },
        });
        if (!purchase) {
            throw new NotFoundException('Combo not found');
        }

        if (purchase.playlist.deletedAt !== null) {
            const found = readSnapshot(purchase.playlist.snapshot).combos.find((c) => c.id === comboId);
            if (!found) {
                throw new NotFoundException('Combo not found');
            }
            return found;
        }

        // The combo must belong to this playlist: owning one playlist does not open the seller's other combos
        const link = await this.prisma.playlistCombo.findFirst({
            where: { playlistId, comboId },
            select: { combo: { include: comboInclude } },
        });
        if (!link) {
            throw new NotFoundException('Combo not found');
        }
        return link.combo;
    }
}