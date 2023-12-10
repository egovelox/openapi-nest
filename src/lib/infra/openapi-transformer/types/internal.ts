import { OpenAPIV3 } from "openapi-types";
import { Method } from "./public";

export type ConfigOpenApiTransformationCorsOperation = (
  path: string,
  cors: object
) => OpenAPIV3.OperationObject | false;

export type ConfigOpenApiTransformationSecuritySchemesOperation = {
  scheme: Record<string, object>;
  filterSecurity?: (
    path: string,
    method: Method,
    security: Array<Record<string, string[]>>
  ) => Array<Record<string, string[]>> | false;
};

export type ConfigOpenApiTransformationApiGatewayIntegration = {
  proxyBaseUrl: string;
  routeIntegration: (route: { path: string; method: Method }, extension: object) => object;
  securitySchemesExtensions?: {
    [securityName: string]: object;
  };
  binaryMediaTypes?: string[];
};
