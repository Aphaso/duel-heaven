import { Controller, Get, HttpCode, Post, UseGuards} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ConnectService } from './connect.service';

@Controller('connect')
@UseGuards(AuthGuard)
export class ConnectController {
    constructor(private readonly connect: ConnectService) {}

    @Get('status')
    status(@CurrentUserId() userId: string) {
        return this.connect.status(userId);
    }

    @Post('onboarding')
    @HttpCode(200)
    onboarding(@CurrentUserId() userId: string) {
        return this.connect.onboardingLink(userId);
    }
}