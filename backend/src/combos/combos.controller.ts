import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { CombosService } from './combos.service';
import { SaveComboDto } from './save-combo.dto';

@Controller('combos')
export class CombosController {
    constructor(private readonly combos: CombosService) {}

    @Get()
    findAll() {
        return this.combos.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.combos.findOne(id);
    }

    @Post()
    create(@Body() dto: SaveComboDto) {
        return this.combos.create(dto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: SaveComboDto) {
        return this.combos.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@Param('id') id: string) {
        return this.combos.remove(id);
    }
}