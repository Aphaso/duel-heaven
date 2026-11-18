import { Module } from '@nestjs/common';
import { DecksController } from './decks.controller';
import { DecksService } from './decks.service';
import { ProxiesService } from './proxies.service';
import { AuthModule } from '../auth/auth.module';
import { CardsModule } from '../cards/cards.module';

@Module({
    imports: [AuthModule, CardsModule],
    controllers: [DecksController],
    providers: [DecksService, ProxiesService],
})
export class DecksModule {}