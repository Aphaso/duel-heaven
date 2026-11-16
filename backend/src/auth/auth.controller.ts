import { Body, Controller, Get, HttpCode, Patch, Post, Query, UseGuards, Res } from '@nestjs/common';
import { LoginDto, RegisterDto, UpdateProfileDto } from './auth.dto';
import { GoogleLoginDto, GoogleCompleteDto } from './google-auth.dto';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { GoogleAuthService } from './google-auth.service';
import { CurrentUserId } from './current-user.decorator';
import type { Response } from 'express';
import { clearSessionCookie, setSessionCookie } from './session-cookie';

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService, private readonly googleAuth: GoogleAuthService) {}

    @Post('register')
    async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, user } = await this.auth.register(dto);
        setSessionCookie(res, accessToken);
        return { user }; // Token not in the body
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, user } = await this.auth.login(dto);
        setSessionCookie(res, accessToken);
        return { user };
    }

    @Post('logout')
    @HttpCode(204)
    logout(@Res({ passthrough: true }) res: Response) {
        clearSessionCookie(res);
    }

    @Post('google')
    @HttpCode(200)
    async google(@Body() dto: GoogleLoginDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.googleAuth.login(dto.credential);
        if (result.status === 'authenticated') {
            setSessionCookie(res, result.accessToken);
            return { status: result.status, user: result.user };
        }
        return result;
    }

    @Post('google/complete')
    async googleComplete(@Body() dto: GoogleCompleteDto, @Res({ passthrough: true }) res: Response) {
        const { accessToken, user } = await this.googleAuth.complete(dto.signupToken, dto.username);
        setSessionCookie(res, accessToken);
        return { user };
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