import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeEmail, normalizeUsername, usernameProblem } from './auth-utils';

const SIGNUP_PURPOSE = 'google-signup';

type SignupClaims = { purpose: string; googleId: string; email: string; name: string };

const userSelect = {
    id: true,
    email: true,
    username: true,
    displayName: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class GoogleAuthService {
    private readonly clientId: string;
    private readonly client: OAuth2Client;

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
        config: ConfigService,
    ) {
        this.clientId = config.getOrThrow<string>('GOOGLE_CLIENT_ID');
        this.client = new OAuth2Client(this.clientId);
    }

    /** Check signature, expiration and recipient of the Google token */
    private async verifyCredential(credential: string) {
        let payload;
        try {
            const ticket = await this.client.verifyIdToken({
                idToken: credential,
                audience: this.clientId, // Token must have been emitted for this app
            });
            payload = ticket.getPayload();
        } catch {
            throw new UnauthorizedException('Invalid Google credential');
        }
        if (!payload?.sub || !payload.email || payload.email_verified !== true) {
            throw new UnauthorizedException('This Google Account has no verified email');
        }
        return {
            googleId: payload.sub,
            email: normalizeEmail(payload.email),
            name: (payload.name ?? payload.email).trim(),
        };
    }

    async login(credential: string) {
        const google = await this.verifyCredential(credential);

        const existing = await this.prisma.user.findUnique({
            where: { googleId: google.googleId },
            select: userSelect,
        });
        if (existing) {
            return {
                status: 'authenticated' as const,
                accessToken: await this.jwt.signAsync({ sub: existing.id }),
                user: existing,
            };
        }

        /** Do not automatically link an already email+password account with a new Google Account with the same email.
         *  Since we do not check the email on registration, someone could create a fake account with someone else's email,
         *  wait for them to login with Google and end up inside their account.
         */
        const sameEmail = await this.prisma.user.findUnique({
            where: { email: google.email },
            select: { id: true },
        });
        if (sameEmail) {
            throw new ConflictException('An account with this email already exists. Log in with your password.');
        }

        const claims: SignupClaims = { purpose: SIGNUP_PURPOSE, ...google };
        const signupToken = await this.jwt.signAsync(claims, { expiresIn: '15m' });
        return {
            status: 'signup' as const,
            signupToken,
            name: google.name,
            email: google.email,
        };
    }

    async complete(signupToken: string, rawUsername: string) {
        const claims = await this.readSignupToken(signupToken);

        const username = normalizeUsername(rawUsername);
        const problem = usernameProblem(username);
        if (problem) {
            throw new BadRequestException(problem);
        }

        const taken = await this.prisma.user.findUnique({
            where: { username },
            select: { id: true },
        });
        if (taken) {
            throw new ConflictException('Username already taken');
        }

        try {
            const user = await this.prisma.user.create({
                data: {
                    email: claims.email,
                    username,
                    displayName: claims.name,
                    googleId: claims.googleId,
                },
                select: userSelect,
            });
            return { accessToken: await this.jwt.signAsync({ sub: user.id }), user };
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                throw new ConflictException('Username or account already exists');
            }
            throw e;
        }
    }

    private async readSignupToken(token: string): Promise<SignupClaims> {
        try {
            const claims = await this.jwt.verifyAsync<SignupClaims>(token);
            if (claims.purpose !== SIGNUP_PURPOSE) {
                throw new Error('wrong token');
            }
            return claims;
        } catch {
            throw new UnauthorizedException('Sign-up expired, please sign in with Google again');
        }
    }
}