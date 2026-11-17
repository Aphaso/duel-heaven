import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { CombosService } from './combos.service';
import { SaveComboDto } from './save-combo.dto';

@Controller('combos')
@UseGuards(AuthGuard)
export class CombosController {
    constructor(private readonly combos: CombosService) {}

    @Get()
    findAll(@CurrentUserId() userId: string) {
        return this.combos.findAll(userId);
    }

    @Get(':id')
    findOne(@CurrentUserId() userId: string, @Param('id') id: string) {
        return this.combos.findOne(userId, id);
    }

    @Post()
    create(@CurrentUserId() userId: string, @Body() dto: SaveComboDto) {
        return this.combos.create(userId, dto);
    }

    @Put(':id')
    update(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: SaveComboDto) {
        return this.combos.update(userId, id, dto);
    }

    @Post(':id/duplicate')
    duplicate(@CurrentUserId() userId: string, @Param('id') id: string) {
        return this.combos.duplicate(userId, id);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@CurrentUserId() userId: string, @Param('id') id: string) {
        return this.combos.remove(userId, id);
    }
}