import { Body, Controller, Delete, HttpCode, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { clearSessionCookie } from '../auth/session-cookie';
import { AccountService } from './account.service';
import { DeleteAccountDto } from './account.dto';

@Controller('account')
@UseGuards(AuthGuard)
export class AccountController {
    constructor(private readonly account: AccountService) {}

    @Delete()
    @HttpCode(204)
    async remove(@CurrentUserId() userId: string, @Body() dto: DeleteAccountDto, @Res({ passthrough: true }) res: Response) {
        await this.account.deleteAccount(userId, dto.confirmation);
        clearSessionCookie(res);
    }
}