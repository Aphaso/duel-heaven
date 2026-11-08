import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { SaveWthGuideDto } from './save-wth-guide.dto';
import { WthService } from './wth.service';

@Controller('wth')
export class WthController {
    constructor(private readonly wth: WthService) {}

    @Get()
    findAll() {
        return this.wth.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.wth.findOne(id);
    }

    @Post()
    create(@Body() dto: SaveWthGuideDto) {
        return this.wth.create(dto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: SaveWthGuideDto) {
        return this.wth.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@Param('id') id: string) {
        return this.wth.remove(id);
    }
}