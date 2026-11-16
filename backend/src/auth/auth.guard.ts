import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import type { Request } from 'express';
import { SESSION_COOKIE } from './session-cookie';

export type AuthenticatedRequest = Request & { userId?: string };

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly jwt: JwtService,
        private readonly prisma: PrismaService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
        if (!token) {
            throw new UnauthorizedException('Required Access');
        }

        let payload: { sub?: unknown; purpose?: unknown };
        try {
            // Checks signature and expiry
            payload = await this.jwt.verifyAsync<{ sub?: unknown; purpose?: unknown }>(token);
        } catch {
            throw new UnauthorizedException('Invalid or expired session');
        }

        // Accept only real session tokens: they have a "sub" and no "purpose"
        // Other tokens signed with the same secret (for example the Google sign-up one) must not work here
        if (typeof payload.sub !== 'string' || payload.sub === '' || payload.purpose !== undefined) {
            throw new UnauthorizedException('Invalid or expired session');
        }

        // The token can outlive the account (deleted from another device): check the user still exists
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true } });
        if (!user) {
            throw new UnauthorizedException('Invalid or expired session');
        }

        request.userId = payload.sub;
        return true;
    }
}