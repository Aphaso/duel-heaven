import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { StoreService } from './store.service';

@Controller('store')
@UseGuards(AuthGuard)
export class StoreController {
    constructor(private readonly store: StoreService) {}

    @Get('playlists')
    list(@CurrentUserId() userId: string) {
        return this.store.list(userId);
    }

    @Get('playlists/:id')
    detail(@CurrentUserId() userId: string, @Param('id') id: string) {
        return this.store.detail(userId, id);
    }
}