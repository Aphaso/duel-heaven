import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseEnumPipe, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { DeckSection } from '../generated/prisma/enums';
import { DecksService } from './decks.service';
import { CreateDeckDto } from './create-deck.dto';
import { UpdateDeckDto } from './update-deck.dto';
import { SetDeckCardDto } from './set-deck-card.dto';

@Controller('decks')
export class DecksController {
    constructor(private readonly decksService: DecksService) {}

    @Get()
    findAll() {
        return this.decksService.findAll();
    }

    @Post()
    create(@Body() dto: CreateDeckDto) {
        return this.decksService.create(dto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.decksService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateDeckDto) {
        return this.decksService.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id') id: string) {
        return this.decksService.remove(id);
    }

    @Put(':id/cards')
    setCard(@Param('id') id: string, @Body() dto: SetDeckCardDto) {
        return this.decksService.setCard(id, dto);
    }

    @Delete(':id/cards/:cardId')
    removeCard(
        @Param('id') id: string,
        @Param('cardId', ParseIntPipe) cardId: number,
        @Query('section', new ParseEnumPipe(DeckSection)) section: DeckSection,
    ) {
        return this.decksService.removeCard(id, cardId, section);
    }
}