import { Module } from '@nestjs/common';
import { SidePatternsController } from './side-patterns.controller';
import { SidePatternsService } from './side-patterns.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [SidePatternsController],
    providers: [SidePatternsService],
})
export class SidePatternsModule {}