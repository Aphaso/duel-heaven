import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StoreController } from './store.controller';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StoreService } from './store.service';
import { CheckoutService } from './checkout.service';
import { StripeModule } from '../stripe/stripe.module';
import { ConnectModule } from '../connect/connect.module';

@Module({
    imports: [AuthModule, StripeModule, ConnectModule],
    controllers: [StoreController, StripeWebhookController],
    providers: [StoreService, CheckoutService],
})
export class StoreModule {}