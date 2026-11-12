import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { DecksService } from './decks.service';
import { CreateDeckDto } from './create-deck.dto';
import { UpdateDeckDto } from './update-deck.dto';
import { SaveDeckListDto } from './save-deck-list.dto';

@Controller('decks')
@UseGuards(AuthGuard)
export class DecksController {
    constructor(private readonly decksService: DecksService) {}

    @Get()
    findAll(@CurrentUserId() userId: string) {
        return this.decksService.findAll(userId);
    }

    @Post()
    create(@CurrentUserId() userId: string, @Body() dto: CreateDeckDto) {
        return this.decksService.create(userId, dto);
    }

    @Get(':id')
    findOne(@CurrentUserId() userId: string, @Param('id') id: string) {
        return this.decksService.findOne(userId, id);
    }

    @Patch(':id')
    update(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: UpdateDeckDto) {
        return this.decksService.update(userId, id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@CurrentUserId() userId: string, @Param('id') id: string) {
        return this.decksService.remove(userId, id);
    }

    @Put(':id/list')
    saveList(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: SaveDeckListDto) {
        return this.decksService.saveList(userId, id, dto);
    }
}