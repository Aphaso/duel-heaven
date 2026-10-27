import { Body, Controller, Get, Post } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './create-card.dto';

@Controller('cards')
export class CardsController {
    constructor(private readonly cardsService: CardsService) {}

    @Get()
    findAll() {
        return this.cardsService.findAll()
    }

    @Post()
    create(@Body() dto: CreateCardDto) {
        return this.cardsService.create(dto);
    }
}