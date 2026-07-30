import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UserPayload } from '../interfaces/user-payload.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof UserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserPayload | undefined;
    if (!user) throw new UnauthorizedException('Not authenticated');
    return data ? user[data] : user;
  },
);
