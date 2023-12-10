import { NestExpressApplication } from "@nestjs/platform-express";
import { OpenAPIV3 } from "openapi-types";
import { SwaggerUiServer } from "../core/port/swagger.ui.server";
import swaggerUi from "swagger-ui-express";

export class SwaggerUiServerImpl implements SwaggerUiServer {
  serveDocumentation(
    path: string,
    app: NestExpressApplication,
    openapiDocument: OpenAPIV3.Document
  ): void {
    app.use(path, swaggerUi.serve, swaggerUi.setup(openapiDocument));
  }
}
