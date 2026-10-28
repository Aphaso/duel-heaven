import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { CreateDeckDto } from './create-deck.dto';
import { UpdateDeckDto } from './update-deck.dto';
import { DecksService } from './decks.service';

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
}