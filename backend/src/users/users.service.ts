import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/* Temporary development user: used so that the code is ready to support multiple users
   without having to worry about implementing logins and accounting right now.
   This way I can focus on the logic of the service and think about the users later.
*/
export const DEMO_USER_ID = 'demo-user';

@Injectable()
export class UsersService implements OnModuleInit {
    constructor(private readonly prisma: PrismaService) {}

    async onModuleInit() {
        await this.prisma.user.upsert({
            where: { id: DEMO_USER_ID },
            update: {},
            create: {
                id: DEMO_USER_ID,
                username: 'demo',
                displayName: 'Demo User',
            },
        });
    }
}