import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Module({
    imports: [
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                // getOrThrow: if JWT_SECRET is missing the server does not start,
                // so that it does not sign tokens with an empty secret
                secret: config.getOrThrow<string>('JWT_SECRET'),
                signOptions: { expiresIn: '7d' },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, AuthGuard],
    // The other modules import AuthModule to use the guard
    exports: [AuthGuard, JwtModule],
})
export class AuthModule {}