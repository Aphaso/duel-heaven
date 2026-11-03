import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common';
import { DecksService } from './decks.service';
import { CreateDeckDto } from './create-deck.dto';
import { UpdateDeckDto } from './update-deck.dto';
import { SaveDeckListDto } from './save-deck-list.dto';

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

    @Put(':id/list')
    saveList(@Param('id') id: string, @Body() dto: SaveDeckListDto) {
        return this.decksService.saveList(id, dto);
    }
}