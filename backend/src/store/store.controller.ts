import { Controller, Get, Param, UseGuards, Body, HttpCode, Post } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { StoreService } from './store.service';
import { CheckoutService } from './checkout.service';
import { ConfirmCheckoutDto } from './checkout.dto';

@Controller('store')
@UseGuards(AuthGuard)
export class StoreController {
    constructor(
        private readonly store: StoreService,
        private readonly checkoutService: CheckoutService,
    ) {}

    @Get('playlists')
    list(@CurrentUserId() userId: string) {
        return this.store.list(userId);
    }

    @Get('playlists/:id')
    detail(@CurrentUserId() userId: string, @Param('id') id: string) {
        return this.store.detail(userId, id);
    }

    @Post('playlists/:id/checkout')
    @HttpCode(200)
    checkout(@CurrentUserId() userId: string, @Param('id') id: string) {
        return this.checkoutService.createSession(userId, id);
    }

    @Post('checkout/confirm')
    @HttpCode(200)
    confirm(@CurrentUserId() userId: string, @Body() dto: ConfirmCheckoutDto) {
        return this.checkoutService.confirm(userId, dto.sessionId);
    }
}