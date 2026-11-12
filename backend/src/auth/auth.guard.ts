import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { bearerToken } from './auth-utils';

export type AuthenticatedRequest = Request & { userId?: string };

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly jwt: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const token = bearerToken(request.headers.authorization);
        if (!token) {
            throw new UnauthorizedException('Required Access');
        }
        try {
            // Checks signature and expiry
            const payload = await this.jwt.verifyAsync<{ sub: string }>(token);
            request.userId = payload.sub;
        } catch {
            throw new UnauthorizedException('Invalid or expired session');
        }
        return true;
    }
}