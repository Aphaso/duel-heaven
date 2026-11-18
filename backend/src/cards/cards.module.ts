import { Module } from '@nestjs/common';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { CardsSyncService } from './cards-sync.service';
import { CardImagesService } from './card-images.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [CardsController],
    providers: [CardsService, CardsSyncService, CardImagesService],
    exports: [CardImagesService],
})
export class CardsModule {}