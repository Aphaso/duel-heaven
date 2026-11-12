import { Module } from '@nestjs/common';
import { WthController } from './wth.controller';
import { WthService } from './wth.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [WthController],
    providers: [WthService],
})
export class WthModule {}