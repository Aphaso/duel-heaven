import { Body, Controller, Get, HttpCode, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { LoginDto, RegisterDto, UpdateProfileDto } from './auth.dto';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CurrentUserId } from './current-user.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) {}

    @Post('register')
    register(@Body() dto: RegisterDto) {
        return this.auth.register(dto);
    }

    @Post('login')
    @HttpCode(200)
    login(@Body() dto: LoginDto) {
        return this.auth.login(dto);
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