import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { buildPlaylistSnapshot } from '../playlists/playlist-snapshot';
import { isDeletionConfirmed } from './account-deletion';

@Injectable()
export class AccountService {
    private readonly logger = new Logger(AccountService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly stripe: StripeService,
    ) {}

    /**
     * Deletes the account and everything that belongs to it.
     * Playlists that other people bought are the sole exception: they stay as anonymous archived snapshots,
     * so the buyers keep what they paid for.
     * Playlists nobody bought are deleted.
     */
    async deleteAccount(userId: string, confirmation: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { username: true, email: true, stripeAccountId: true },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (!isDeletionConfirmed(confirmation, user)) {
            throw new BadRequestException('The confirmation does not match');
        }

        // If someone buys one of these playlists while this is working, the database
        // refuses to delete it, the whole operation is undone and the user can try again.
        await this.prisma.$transaction(
            async (tx) => {
                const playlists = await tx.playlist.findMany({
                    where: { ownerId: userId },
                    select: { id: true, deletedAt: true, _count: { select: { purchases: true } } },
                });

                for (const p of playlists) {
                    if (p._count.purchases === 0) {
                        await tx.playlist.delete({ where: { id: p.id } });
                    } else if (p.deletedAt === null) {
                        const snapshot = await buildPlaylistSnapshot(tx, p.id);
                        await tx.playlistCombo.deleteMany({ where: { playlistId: p.id } });
                        await tx.playlist.update({
                            where: { id: p.id },
                            data: { deletedAt: new Date(), isForSale: false, snapshot },
                        });
                    }
                }
                await tx.user.delete({ where: { id: userId } });
            },
            { timeout: 30_000 },
        );

        // This happens after the work on the database: if Stripe fails, the user il already gone and we cannot undo it
        if (user.stripeAccountId) {
            await this.closeStripeAccount(user.stripeAccountId);
        }
    }

    /** Best effort: a failure is logged for a manual cleanup, but it does not undo the deletion. */
    private async closeStripeAccount(accountId: string) {
        try {
            const account = await this.stripe.client.v2.core.accounts.retrieve(accountId);
            // Stripe wants all the configurations of the account in the request
            await this.stripe.client.v2.core.accounts.close(accountId, { applied_configurations: account.applied_configurations });
        } catch (e) {
            this.logger.error(
                `Stripe account ${accountId} was NOT closed: close it by hand from the dashboard`,
                e instanceof Error ? e.stack : String(e),
            );
        }
    }
}