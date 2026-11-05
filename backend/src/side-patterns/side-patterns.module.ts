import { Module } from '@nestjs/common';
import { SidePatternsController } from './side-patterns.controller';
import { SidePatternsService } from './side-patterns.service';

@Module({
    controllers: [SidePatternsController],
    providers: [SidePatternsService],
})
export class SidePatternsModule {}