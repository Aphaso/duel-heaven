import { Controller, DefaultValuePipe, Get, Header, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CardsSyncService } from './cards-sync.service';
import { CardImagesService } from './card-images.service';

@Controller('cards')
export class CardsController {
    constructor(
        private readonly cardsService: CardsService,
        private readonly cardsSyncService: CardsSyncService,
        private readonly cardImagesService: CardImagesService
    ) {}

    @Get()
    search(
        @Query('search') search?: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
    ) {
        return this.cardsService.search({
            search,
            page: Math.max(page, 1),
            limit: Math.min(Math.max(limit, 1), 100),
        });
    }

    @Post('sync')
    sync() {
        return this.cardsSyncService.sync();
    }

    @Post('images/sync')
    syncImages() {
        return this.cardImagesService.start();
    }

    @Get('images/status')
    imagesStatus() {
        return this.cardImagesService.status();
    }

    @Get(':id/image')
    @Header('Cache-Control', 'public, max-age=86400')
    imag(@Param('id', ParseIntPipe) id: number) {
        return this.cardImagesService.getImage(id);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.cardsService.findOne(id);
    }
}