import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { SaveSidePatternDto } from './save-side-pattern.dto';
import { SidePatternsService } from './side-patterns.service';

@Controller('decks/:deckId/side-patterns')
@UseGuards(AuthGuard)
export class SidePatternsController {
    constructor(private readonly sidePatternsService: SidePatternsService) {}

    @Get()
    list(@CurrentUserId() userId: string, @Param('deckId') deckId: string) {
        return this.sidePatternsService.list(userId, deckId);
    }

    @Post()
    create(
        @CurrentUserId() userId: string,
        @Param('deckId') deckId: string,
        @Body() dto: SaveSidePatternDto) {
        return this.sidePatternsService.create(userId, deckId, dto);
    }

    @Put(':id')
    update(
        @CurrentUserId() userId: string,
        @Param('deckId') deckId: string,
        @Param('id') id: string,
        @Body() dto: SaveSidePatternDto,
    ) {
        return this.sidePatternsService.update(userId, deckId, id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(
        @CurrentUserId() userId: string,
        @Param('deckId') deckId: string,
        @Param('id') id: string,
    ) {
        return this.sidePatternsService.remove(userId, deckId, id);
    }
}