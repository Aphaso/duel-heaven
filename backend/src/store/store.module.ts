import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StoreController } from './store.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StoreService } from './store.service';
import { CheckoutService } from './checkout.service';
import { StripeService } from './stripe.service';

@Module({
    imports: [AuthModule],
    controllers: [StoreController, StripeWebhookController],
    providers: [StoreService, CheckoutService, StripeService],
})
export class StoreModule {}