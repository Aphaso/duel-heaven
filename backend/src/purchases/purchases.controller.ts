import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { PurchasesService } from './purchases.service';

@Controller('purchases')
@UseGuards(AuthGuard)
export class PurchasesController {
    constructor(private readonly purchases: PurchasesService) {}

    @Get()
    list(@CurrentUserId() userId: string) {
        return this.purchases.list(userId);
    }

    @Get(':playlistId')
    detail(@CurrentUserId() userId: string, @Param('playlistId') playlistId: string) {
        return this.purchases.detail(userId, playlistId);
    }

    @Get(':playlistId/combos/:comboId')
    combo(
        @CurrentUserId() userId: string,
        @Param('playlistId') playlistId: string,
        @Param('comboId') comboId: string,
    ) {
        return this.purchases.combo(userId, playlistId, comboId);
    }
}