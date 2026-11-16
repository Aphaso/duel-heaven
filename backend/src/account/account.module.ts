import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StripeModule } from '../stripe/stripe.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
    imports: [AuthModule, StripeModule],
    controllers: [AccountController],
    providers: [AccountService],
})
export class AccountModule {}