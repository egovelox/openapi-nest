import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { Request } from "express";
import { SecurityHandlers } from "express-openapi-validator/dist/framework/types";
import { OpenAPIV3 } from "openapi-types";
import { z } from "zod";

export type UserInfo = {
  token: string;
  userId: string;
  asBearer: () => `Bearer ${string}`;
  type: UserType;
};

export interface RequestWithUser extends Request {
  user: UserInfo;
}

export type AuthHandlers = {
  [key: string]: (
    request: RequestWithUser,
    scopes: string[],
    schema: OpenAPIV3.SecuritySchemeObject
  ) => boolean | Promise<boolean>;
};

export type DefaultAuthHandlers = {
  [key in Auth]: (
    request: RequestWithUser,
    scopes: string[],
    schema: OpenAPIV3.SecuritySchemeObject
  ) => boolean | Promise<boolean>;
};

export const User = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  return request.user;
});

export const CognitoSchema = z.object({
  identities: z.array(
    z.object({
      userId: z.string(),
    })
  ),
});

export const AdfsSchema = z.object({
  SAMAccountName: z.string(),
});

export function prepareToken(request: RequestWithUser): PreparedToken | undefined {
  const header = request.headers["authorization"];
  if (typeof header !== "string") {
    return undefined;
  }
  if (!header.toLowerCase().startsWith(BEARER_PREFIX.toLowerCase())) {
    return undefined;
  }
  const token = header.substring(BEARER_PREFIX.length).trim();
  const relevantContentAsBase64 = token.split(".")[1];
  if (!relevantContentAsBase64) {
    return undefined;
  }
  const relevantContent = Buffer.from(relevantContentAsBase64, "base64").toString("utf-8");
  return { token, relevantContent };
}

export function buildUserInfo(token: string, userId: string, type: UserType): UserInfo {
  return {
    token,
    userId,
    type,
    asBearer: () => `${BEARER_PREFIX} ${token}`,
  };
}

enum Auth {
  cognito = "cognito",
  adfs = "adfs",
}

type UserType = "cognito" | "adfs" | "client" | `${string}`;

const BEARER_PREFIX = "Bearer";

type PreparedToken = {
  token: string;
  relevantContent: string;
};
