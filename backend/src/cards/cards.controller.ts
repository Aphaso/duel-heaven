import { Body, Controller, Get, Post } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsSyncService } from './cards-sync.service';
import { CreateCardDto } from './create-card.dto';

@Controller('cards')
export class CardsController {
    constructor(
        private readonly cardsService: CardsService,
        private readonly cardsSyncService: CardsSyncService,
    ) {}

    @Get()
    findAll() {
        return this.cardsService.findAll()
    }

    @Post()
    create(@Body() dto: CreateCardDto) {
        return this.cardsService.create(dto);
    }

    @Post('sync')
    sync() {
        return this.cardsSyncService.sync();
    }
}