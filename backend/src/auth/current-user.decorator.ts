import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { AuthenticatedRequest } from './auth.guard';

/** The id of the logged-in user, in a controller method: `me(@CurrentUserId() userId: string)`. */
export const CurrentUserId = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.userId) {
        // Only if the route forgot @UseGuards(AuthGuard)
        throw new UnauthorizedException('Required Access')
    }
    return request.userId;
})