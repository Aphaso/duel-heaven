import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { SaveWthGuideDto } from './save-wth-guide.dto';
import { WthService } from './wth.service';

@Controller('wth')
@UseGuards(AuthGuard)
export class WthController {
    constructor(private readonly wth: WthService) {}

    @Get()
    findAll(@CurrentUserId() userId: string) {
        return this.wth.findAll(userId);
    }

    @Get(':id')
    findOne(@CurrentUserId() userId: string, @Param('id') id: string) {
        return this.wth.findOne(userId, id);
    }

    @Post()
    create(@CurrentUserId() userId: string, @Body() dto: SaveWthGuideDto) {
        return this.wth.create(userId, dto);
    }

    @Put(':id')
    update(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: SaveWthGuideDto) {
        return this.wth.update(userId, id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@CurrentUserId() userId: string, @Param('id') id: string) {
        return this.wth.remove(userId, id);
    }
}