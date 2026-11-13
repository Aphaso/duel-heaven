import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

/** Only place knowing the Stripe keys */
@Injectable()
export class StripeService {
    readonly client: Stripe;
    readonly webhookSecret: string;

    constructor(config: ConfigService) {
        this.client = new Stripe(config.getOrThrow<string>('STRIPE_SECRET_KEY'));
        this.webhookSecret = config.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    }
}