import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Stripe from 'stripe';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';

@Injectable()
export class CheckoutService {
    private readonly logger = new Logger(CheckoutService.name);
    private readonly frontendUrl: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly stripe: StripeService,
        config: ConfigService,
    ) {
        this.frontendUrl = config.getOrThrow<string>('FRONTEND_URL');
    }

    /** Creates the Stripe payment page for one playlist and returns its address */
    async createSession(userId: string, playlistId: string) {
        const playlist = await this.prisma.playlist.findFirst({
            where: { id: playlistId, isForSale: true, deletedAt: null },
            select: { id: true, name: true, ownerId: true, priceCents: true },
        });
        if (!playlist || playlist.priceCents === null) {
            throw new NotFoundException('Playlist not found');
        }
        if (playlist.ownerId === userId) {
            throw new BadRequestException("You can't buy your own Playlist");
        }
        const already = await this.prisma.purchase.findUnique({
            where: { buyerId_playlistId: { buyerId: userId, playlistId } },
            select: { id: true },
        });
        if (already) {
            throw new ConflictException('You already own this Playlist');
        }

        const session = await this.stripe.client.checkout.sessions.create({
            mode: 'payment',
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: 'eur',
                        unit_amount: playlist.priceCents,
                        product_data: { name: playlist.name },
                    },
                },
            ],
            // Who is buying what: we read it back when the payment is confirmed
            metadata: { playlistId: playlist.id, buyerId: userId },
            client_reference_id: userId,
            success_url: `${this.frontendUrl}/purchases/success/?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${this.frontendUrl}/store/${playlist.id}`,
        });
        if (!session.url) {
            throw new BadRequestException('Could not start the payment');
        }
        return { url: session.url };
    }

    /** Called by the return page: asks Strupe directly how the payment went */
    async confirm(userId: string, sessionId: string) {
        let session: Stripe.Checkout.Session;
        try {
            session = await this.stripe.client.checkout.sessions.retrieve(sessionId);
        } catch {
            throw new NotFoundException('Payment not found');
        }
        // A session that is not yours looks the same as one that does not exist
        if (session.metadata?.buyerId !== userId) {
            throw new NotFoundException('Payment not found');
        }
        const playlistId = session.metadata.playlistId ?? null;

        await this.fulfillSession(session);

        const purchase = await this.prisma.purchase.findUnique({
            where: { stripeSessionId: session.id },
            select: { id: true },
        });
        return { purchased: purchase !== null, playlistId };
    }

    /**
     * Records the purchase.
     * Safe to call many times for the same payment (webhook, return page, Stripe retries),
     * since the second time it does nothing.
     */
    async fulfillSession(session: Stripe.Checkout.Session): Promise<void> {
        if (session.payment_status !== 'paid') {
            return;
        }
        const playlistId = session.metadata?.playlistId;
        const buyerId = session.metadata?.buyerId;
        if (!playlistId || !buyerId) {
            this.logger.warn(`Session ${session.id} has no metadata, ignored`);
            return;
        }

        try {
            await this.prisma.purchase.create({
                data: {
                    buyerId,
                    playlistId,
                    stripeSessionId: session.id,
                    // The amount actually paid, not the current price
                    amountCents: session.amount_total ?? 0,
                    currency: session.currency ?? 'eur',
                },
            });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError) {
                if (e.code === 'P2002') {
                    // Already recorded, so either same session or the buyer already owns it
                    this.logger.log(`Session ${session.id} already recorded`);
                    return;
                }
                if (e.code === 'P2003') {
                    // The playlist or the buyer no longer exists: money taken, nothing to give. Needs a manual refund
                    this.logger.error(`Session ${session.id} paid but Playlist/Buyer missing: REFUND NEEDED`);
                    return;
                }
            }
            throw e;
        }
    }
}