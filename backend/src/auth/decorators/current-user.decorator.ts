import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  id: string;
  sub: string; // userId
  email: string;
  role: string;
  verified: boolean;
  isImpersonated?: boolean;
  impersonatorId?: string;
  adminSubRole?: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);