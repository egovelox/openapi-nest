import { OpenApiValidatorOpts } from "express-openapi-validator/dist/openapi.validator";

export { OpenAPIV3 } from "openapi-types";

export type OpenapiSchemaObjects = {
  controllers: OpenapiController[];
  operations: Operation[];
};
export type OpenapiController = {
  name: string;
  pathSegment: string | undefined;
};
export type Operation = {
  path: string;
  operationId: string;
  httpMethod: string;
  successResponseCode: string;
  responseMediaType: string | undefined;
  requestBodyMediaType: string | undefined;
  hasPathParameters: boolean;
  hasQueryParameters: boolean;
  controller: string | undefined;
  controllerPathSegment: string | undefined;
};

export type OpenapiHealthResponse = {
  status: string;
};

export type OpenapiVersionResponse = {
  version: string;
};

export enum OpenapiApiInfoPaths {
  HEALTH = "health",
  VERSION = "version",
}

export type IoValidationOptions = {
  /**
   * If true, will set for you `cognito` and `adfs` SecurityHandlers
   *
   * @remarks
   * See https://github.com/cdimascio/express-openapi-validator/wiki/Documentation#security-handlers
   * */
  useCognitoAdfsSecurityHandlers?: boolean;
  /**
   * OpenApiValidatorOpts from openapi-express-validator (but removed is the `apiSpec` field)
   *
   * @remarks
   * See https://github.com/cdimascio/express-openapi-validator/blob/master/src/framework/types.ts
   * See also https://github.com/cdimascio/express-openapi-validator/wiki/Documentation
   * */
  openapiValidatorOptions?: Omit<OpenApiValidatorOpts, "apiSpec">;
};
