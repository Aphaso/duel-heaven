import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEMO_USER_ID } from '../users/users.service';
import { normalizeEmail, normalizeUsername, usernameProblem } from './auth-utils';
import { LoginDto, RegisterDto, UpdateProfileDto } from './auth.dto';
import { DUMMY_HASH, hashPassword, verifyPassword } from './password';

export interface PublicUser {
    id: string;
    email: string | null;
    /** null = the user has not chosen it yet (e.g. just signed in with Google). */
    username: string | null;
    displayName: string | null;
}

export interface AuthResult {
    accessToken: string;
    user: PublicUser;
}

function isUniqueViolation(e: unknown): boolean {
    // P2002 = unique constraint violated
    return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
}

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
    ) {}

    async register(dto: RegisterDto): Promise<AuthResult> {
        const email = normalizeEmail(dto.email);
        const username = normalizeUsername(dto.username);
        const displayName = dto.displayName.trim();

        const problem = usernameProblem(username);
        if (problem) {
            throw new BadRequestException(problem);
        }
        if (displayName === '') {
            throw new BadRequestException('The displayed name is mandatory');
        }

        // Clear messages for the common cases. The unclaimed demo user is left out of the
        // check: the first account takes over its data, so it cannot clash with itself.
        const clashes = await this.prisma.user.findMany({
            where: {
                AND: [
                    { NOT: { id: DEMO_USER_ID, passwordHash: null } },
                    { OR: [{ email }, { username }] },
                ],
            },
            select: { email: true, username: true },
        });
        if (clashes.some((u) => u.email === email)) {
            throw new ConflictException('Email already in use');
        }
        if (clashes.some((u) => u.username === username)) {
            throw new ConflictException('Username already in use');
        }

        const passwordHash = await hashPassword(dto.password);
        try {
            // The data created before the accounts belongs to the demo user: the FIRST account
            // takes it over. updateMany with "passwordHash: null" is atomic, so if two people
            // register at the same moment only one of them gets the data.
            const claimed = await this.prisma.user.updateMany({
                where: { id: DEMO_USER_ID, passwordHash: null },
                data: { email, username, displayName, passwordHash },
            });
            const user =
                claimed.count === 1
                    ? await this.prisma.user.findUniqueOrThrow({ where: { id: DEMO_USER_ID } })
                    : await this.prisma.user.create({ data: { email, username, displayName, passwordHash } });
            return await this.result(user);
        } catch (e) {
            // Someone else took the email or the username between the check and the write
            if (isUniqueViolation(e)) {
                throw new ConflictException('Email or username already in use');
            }
            throw e;
        }
    }

    async login(dto: LoginDto): Promise<AuthResult> {
        const user = await this.prisma.user.findUnique({ where: { email: normalizeEmail(dto.email) } });
        // The same work and the same answer whether the email exists or not
        const valid = await verifyPassword(dto.password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !user.passwordHash || !valid) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.result(user);
    }

    async me(userId: string): Promise<PublicUser> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return this.publicUser(user);
    }

    /** For the live check in the registration form. It only says yes or no, with the reason. */
    async usernameAvailable(raw: string): Promise<{ available: boolean; reason?: string }> {
        const problem = usernameProblem(raw);
        if (problem) {
            return { available: false, reason: problem };
        }
        const taken = await this.prisma.user.findUnique({
            where: { username: normalizeUsername(raw) },
            select: { id: true },
        });
        return taken ? { available: false, reason: 'Username already in use' } : { available: true };
    }

    /** Sets the username and/or the display name of the logged-in user. */
    async updateProfile(userId: string, dto: UpdateProfileDto): Promise<PublicUser> {
        const data: { username?: string; displayName?: string } = {};

        if (dto.username !== undefined) {
            const username = normalizeUsername(dto.username);
            const problem = usernameProblem(username);
            if (problem) {
                throw new BadRequestException(problem);
            }
            const taken = await this.prisma.user.findFirst({
                where: { username, NOT: { id: userId } },
                select: { id: true },
            });
            if (taken) {
                throw new ConflictException('Username already in use');
            }
            data.username = username;
        }
        if (dto.displayName !== undefined) {
            const displayName = dto.displayName.trim();
            if (displayName === '') {
                throw new BadRequestException('The displayed name is mandatory');
            }
            data.displayName = displayName;
        }
        if (Object.keys(data).length === 0) {
            throw new BadRequestException('Nothing to update');
        }

        try {
            const user = await this.prisma.user.update({ where: { id: userId }, data });
            return this.publicUser(user);
        } catch (e) {
            if (isUniqueViolation(e)) {
                throw new ConflictException('Username already in use');
            }
            throw e;
        }
    }

    private publicUser(user: PublicUser): PublicUser {
        return {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.displayName,
        };
    }

    private async result(user: PublicUser): Promise<AuthResult> {
        return {
            accessToken: await this.jwt.signAsync({ sub: user.id }),
            user: this.publicUser(user),
        };
    }
}