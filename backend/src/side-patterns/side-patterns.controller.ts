import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import { SaveSidePatternDto } from './save-side-pattern.dto';
import { SidePatternsService } from './side-patterns.service';

@Controller('decks/:deckId/side-patterns')
export class SidePatternsController {
    constructor(private readonly sidePatternsService: SidePatternsService) {}

    @Get()
    list(@Param('deckId') deckId: string) {
        return this.sidePatternsService.list(deckId);
    }

    @Post()
    create(@Param('deckId') deckId: string, @Body() dto: SaveSidePatternDto) {
        return this.sidePatternsService.create(deckId, dto);
    }

    @Put(':id')
    update(
        @Param('deckId') deckId: string,
        @Param('id') id: string,
        @Body() dto: SaveSidePatternDto,
    ) {
        return this.sidePatternsService.update(deckId, id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('deckId') deckId: string, @Param('id') id: string) {
        return this.sidePatternsService.remove(deckId, id);
    }
}