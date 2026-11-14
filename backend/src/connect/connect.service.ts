import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { PLATFORM_FEE_PERCENT } from '../store/fees';

@Injectable()
export class ConnectService {
    private readonly frontendUrl: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly stripe: StripeService,
        config: ConfigService,
    ) {
        this.frontendUrl = config.getOrThrow<string>('FRONTEND_URL');
    }

    /** The user's Stripe account id, creating the account the first time. */
    private async ensureAccountId(userId: string): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { stripeAccountId: true, username: true, email: true },
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (user.stripeAccountId) {
            return user.stripeAccountId;
        }
        if (!user.email) {
            throw new BadRequestException('Your account has no email: add one before connecting payments');
        }

        const account = await this.stripe.client.v2.core.accounts.create({
            display_name: user.username ?? 'Duel Heaven seller',
            contact_email: user.email,
            dashboard: 'express',
            defaults: {
                currency: 'eur',
                responsibilities: {
                    fees_collector: 'application',
                    losses_collector: 'application',
                },
            },
            identity: { country: 'IT', entity_type: 'individual' },
            configuration: {
                recipient: {
                    capabilities: { stripe_balance: { stripe_transfers: { requested: true } } },
                },
            },
        });

        // Only one account per user, even with two requests at the same time
        const saved = await this.prisma.user.updateMany({
            where: { id: userId, stripeAccountId: null },
            data: { stripeAccountId: account.id },
        });
        if (saved.count === 0) {
            const current = await this.prisma.user.findUniqueOrThrow({
                where: { id: userId },
                select: { stripeAccountId: true },
            });
            return current.stripeAccountId!;
        }
        return account.id;
    }

    /** The address of the Stripe page where the seller enters their details. */
    async onboardingLink(userId: string) {
        const accountId = await this.ensureAccountId(userId);
        const link = await this.stripe.client.v2.core.accountLinks.create({
            account: accountId,
            use_case: {
                type: 'account_onboarding',
                account_onboarding: {
                    refresh_url: `${this.frontendUrl}/account/payments?refresh=1`,
                    return_url: `${this.frontendUrl}/account/payments`,
                },
            },
        });
        return { url: link.url };
    }

    /** Can this account receive transfers? Asks Stripe every time: it is the only source of truth. */
    async isReady(userId: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { stripeAccountId: true },
        });
        if (!user?.stripeAccountId) {
            return false;
        }
        const account = await this.stripe.client.v2.core.accounts.retrieve(user.stripeAccountId, {
            include: ['configuration.recipient', 'requirements'],
        });
        const transfers = account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers;
        return transfers?.status === 'active';
    }

    async status(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { stripeAccountId: true },
        });
        return { connected: !!user?.stripeAccountId, ready: await this.isReady(userId), feePercent: PLATFORM_FEE_PERCENT };
    }

    /** Throws a clear message if the user cannot sell. */
    async assertCanSell(userId: string) {
        if (!(await this.isReady(userId))) {
            throw new BadRequestException(
                'Connect your payments account before selling (Account > Payments)',
            );
        }
    }
}