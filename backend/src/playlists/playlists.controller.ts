import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { PlaylistsService } from './playlists.service';
import { SavePlaylistDto } from './save-playlist.dto';
import { ReorderPlaylistsDto } from './reorder-playlists.dto';

@Controller('playlists')
@UseGuards(AuthGuard)
export class PlaylistsController {
    constructor(private readonly playlists: PlaylistsService) {}

    @Get()
    findAll(@CurrentUserId() userId: string) {
        return this.playlists.findAll(userId);
    }

    @Get(':id')
    findOne(@CurrentUserId() userId: string, @Param('id') id: string) {
        return this.playlists.findOne(userId, id);
    }

    @Post()
    create(@CurrentUserId() userId: string, @Body() dto: SavePlaylistDto) {
        return this.playlists.create(userId, dto);
    }

    @Put('order')
    @HttpCode(204)
    reorder(@CurrentUserId() userId: string, @Body() dto: ReorderPlaylistsDto) {
        return this.playlists.reorder(userId, dto.ids);
    }

    @Put(':id')
    update(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: SavePlaylistDto) {
        return this.playlists.update(userId, id, dto);
    }

    @Delete(':id')
    @HttpCode(204)
    remove(@CurrentUserId() userId: string, @Param('id') id: string) {
        return this.playlists.remove(userId, id);
    }
}