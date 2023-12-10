import { NestExpressApplication } from "@nestjs/platform-express";
import { OpenAPIV3 } from "openapi-types";

export interface SwaggerUiServer {
  serveDocumentation(
    path: string,
    app: NestExpressApplication,
    openapiDocument: OpenAPIV3.Document
  ): void;
}
