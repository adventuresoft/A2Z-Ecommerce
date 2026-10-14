import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AccessPayload } from '../interfaces/token-payload.interface.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AccessPayload | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
