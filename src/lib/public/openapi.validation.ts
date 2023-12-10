import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { SecurityHandlers } from "express-openapi-validator/dist/framework/types";
import { Response } from "express";
import { error as ValidationExceptions } from "express-openapi-validator";

import { ConfigLoaderImpl } from "../infra/config.loader.impl";
import { IoValidationService } from "../core/service/io.validation.service";
import { AuthHandlers } from "../core/entity/security";
import { defaultAuthHandlers } from "../core/service/auth.handlers.service";
import { IoValidationOptions } from "../core/entity/openapi";
export { RequestWithUser, User, UserInfo } from "../core/entity/security";

export const IoValidation = {
  /**
   * Returns openapi validators to be used as a Nest middleware
   *
   * @param options - see https://github.com/cdimascio/express-openapi-validator/wiki/Documentation
   *
   * @remarks
   * This method will read the openapi spec in order to generate validators
   *
   */
  async getOpenapiValidators(options?: IoValidationOptions) {
    if (options === undefined) {
      return await new IoValidationService(new ConfigLoaderImpl()).getOpenapiValidators();
    }

    let securityHandlers: SecurityHandlers = {};
    if (options.useCognitoAdfsSecurityHandlers) {
      securityHandlers = defaultAuthHandlers as AuthHandlers as SecurityHandlers;
    }
    if (typeof options.openapiValidatorOptions?.validateSecurity === "object") {
      const customHandlers = options.openapiValidatorOptions.validateSecurity.handlers;
      if (customHandlers !== undefined) {
        securityHandlers = { ...securityHandlers, ...customHandlers };
      }
    }

    return await new IoValidationService(new ConfigLoaderImpl()).getOpenapiValidators({
      openapiValidatorOptions: {
        ...options.openapiValidatorOptions,
        validateSecurity: { handlers: securityHandlers },
      },
    });
  },
};

/**
 *  Use this class as a Nest filter.
 *  It will first catch openapi validation errors
 *  (see IoValidation middleware)
 *  and then send a JSON response like :
 *  { "error": "Validation Error", "message": "string" }
 *  with a convenient 4** HTTP response status code.
 */
@Catch(...Object.values(ValidationExceptions))
export class IoValidationExceptionFilter implements ExceptionFilter {
  catch({ status, headers, message }: ValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    return response.status(status).header(headers).json({
      error: "Validation Error",
      message,
      status,
    });
  }
}

interface ValidationError {
  message: string;
  status: number;
  headers: {
    [header: string]: string;
  };
}
