import { Module } from '@nestjs/common';
import { WthController } from './wth.controller';
import { WthService } from './wth.service';

@Module({
    controllers: [WthController],
    providers: [WthService],
})
export class WthModule {}