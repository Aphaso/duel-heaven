import { Prisma } from "../generated/prisma/client";

/**
 * Playlist + full combos (with cards) as plain JSON.
 */
export async function buildPlaylistSnapshot(
    db: Prisma.TransactionClient,
    id: string,
): Promise<Prisma.InputJsonValue> {
    const full = await db.playlist.findFirstOrThrow({
        where: { id },
        select: {
            name: true,
            description: true,
            combos: {
                orderBy: { position: 'asc' },
                select: {
                    combo: {
                        include: {
                            cards: { orderBy: { position: 'asc' }, include: { card: true } },
                        },
                    },
                },
            },
        },
    });
    const data = {
        name: full.name,
        description: full.description,
        // The owner id is left out: the snapshot must not point to a user who may delete their account
        combos: full.combos.map((c) => {
            const { ownerId, ...combo } = c.combo;
            void ownerId;
            return combo;
        }),
    };
    // The database stores plain JSON
    return JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue;
}