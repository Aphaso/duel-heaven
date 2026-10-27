import { Module } from '@nestjs/common';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { CardsSyncService } from './cards-sync.service';

@Module({
    controllers: [CardsController],
    providers: [CardsService, CardsSyncService],
})
export class CardsModule {}