import { Body, Controller, Get, HttpCode, Patch, Post, Query, UseGuards, Res } from '@nestjs/common';
import { LoginDto, RegisterDto, UpdateProfileDto } from './auth.dto';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CurrentUserId } from './current-user.decorator';
import type { Response } from 'express';
import { clearSessionCookie, setSessionCookie } from './session-cookie';

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    @Post('register')
    async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, user } = await this.auth.register(dto);
        setSessionCookie(res, accessToken);
        return { user }; // Token not in the body
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, user } = await this.auth.login(dto);+
        setSessionCookie(res, accessToken);
        return { user };
    }

    @Post('logout')
    @HttpCode(204)
    logout(@Res({ passthrough: true }) res: Response) {
        clearSessionCookie(res);
    }

    /** Public: the registration form asks it while the user types. */
    @Get('username-available')
    usernameAvailable(@Query('username') username = '') {
        return this.auth.usernameAvailable(username);
    }

    @Get('me')
    @UseGuards(AuthGuard)
    me(@CurrentUserId() userId: string) {
        return this.auth.me(userId);
    }

    @Patch('me')
    @UseGuards(AuthGuard)
    updateMe(@CurrentUserId() userId: string, @Body() dto: UpdateProfileDto) {
        return this.auth.updateProfile(userId, dto);
    }
}