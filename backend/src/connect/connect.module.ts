import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { StripeModule } from '../stripe/stripe.module';
import { ConnectController } from './connect.controller';
import { ConnectService } from './connect.service';

@Module({
    imports: [AuthModule, StripeModule],
    controllers: [ConnectController],
    providers: [ConnectService],
    exports: [ConnectService],
})
export class ConnectModule {}