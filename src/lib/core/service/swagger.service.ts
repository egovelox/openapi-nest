import { NestExpressApplication } from "@nestjs/platform-express";

import { Config } from "../entity/bootstrap.config";
import { OpenapiReader } from "../port/openapi.reader";
import { ConfigLoader } from "../port/config.loader";
import { SwaggerUiServer } from "../port/swagger.ui.server";

export class SwaggerService {
  constructor(
    private configLoader: ConfigLoader,
    private openapiReader: OpenapiReader,
    private swaggerUiServer: SwaggerUiServer
  ) {}

  async setup(path: string, app: NestExpressApplication) {
    const packageJsonParams: Config = await this.configLoader.collectPackageJsonConfig();
    const openapiDocument = await this.openapiReader.read(packageJsonParams.openapiFilePath);

    this.swaggerUiServer.serveDocumentation(path, app, openapiDocument);
  }
}
