import { OpenAPIV3 } from "openapi-types";

export type TransformerConfig = {
  name: string;
  version: string;
  openapiFilePath: string;
};

export type ConfigModuleObject = {
  outputPath: string;
  dryRun?: boolean;
  validateSchema?: boolean;
  transformation?: OpenApiTransformationOperation;
  preTransform?: (input: OpenAPIV3.Document, config: TransformerConfig) => OpenAPIV3.Document;
  postTransform?: (input: OpenAPIV3.Document, config: TransformerConfig) => OpenAPIV3.Document;
};

export type OpenApiTransformationOperation = {
  cors?: (path: string, cors: object) => OpenAPIV3.OperationObject | false;
  securitySchemes?: OpenApiTransformationSecuritySchemeOperation;
  apiGatewayIntegration?: OpenApiTransformationApiGatewayIntegrationOperation;
};

export type OpenApiTransformationSecuritySchemeOperation = {
  scheme: Record<string, object>;
  filterSecurity?: (
    path: string,
    method: Method,
    security: Array<Record<string, string[]>>
  ) => Array<Record<string, string[]>> | false;
};

export type OpenApiTransformationApiGatewayIntegrationOperation = {
  proxyBaseUrl: string;
  routeIntegration: (route: { path: string; method: Method }, extension: object) => object;
  securitySchemesExtensions?: {
    [securityName: string]: object;
  };
  binaryMediaTypes?: string[];
};

export type Method = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace";
