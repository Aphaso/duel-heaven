import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { SavePlaylistDto } from './save-playlist.dto';

@Controller('playlists')
export class PlaylistsController {
    constructor(private readonly playlists: PlaylistsService) {}

    @Get()
    findAll() {
        return this.playlists.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.playlists.findOne(id);
    }

    @Post()
    create(@Body() dto: SavePlaylistDto) {
        return this.playlists.create(dto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() dto: SavePlaylistDto) {
        return this.playlists.update(id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@Param('id') id: string) {
        return this.playlists.remove(id);
    }
}