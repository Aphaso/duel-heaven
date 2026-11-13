import { BadRequestException, Controller, Headers, HttpCode, Post, Req, type RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import type Stripe from 'stripe';
import { CheckoutService } from './checkout.service';
import { StripeService } from '../stripe/stripe.service';

@Controller('stripe')
export class StripeWebhookController {
    constructor(
        private readonly stripe: StripeService,
        private readonly checkout: CheckoutService,
    ) {}

    // No AuthGuard: the caller is Stripe, not a logged-in user.
    @Post('webhook')
    @HttpCode(200)
    async handle(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string | undefined,
    ) {
        if (!req.rawBody || !signature) {
            throw new BadRequestException('Missing body or signature');
        }

        let event: Stripe.Event;
        try {
            event = this.stripe.client.webhooks.constructEvent(req.rawBody, signature, this.stripe.webhookSecret);
        } catch {
            throw new BadRequestException('Invalid signature');
        }

        if (
            event.type === 'checkout.session.completed' ||
            event.type === 'checkout.session.async_payment_succeeded'
        ) {
            await this.checkout.fulfillSession(event.data.object);
        }
        return { received: true };
    }
}