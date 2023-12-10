import { NestExpressApplication } from "@nestjs/platform-express";
import { SwaggerService } from "../core/service/swagger.service";
import { OpenapiReaderImpl } from "../infra/openapi.reader.impl";
import { ConfigLoaderImpl } from "../infra/config.loader.impl";
import { SwaggerUiServerImpl } from "../infra/swagger.ui.server.impl";

export class OpenapiSwagger {
  static async setup(documentationEndpoint: string, app: NestExpressApplication) {
    await new SwaggerService(
      new ConfigLoaderImpl(),
      new OpenapiReaderImpl(),
      new SwaggerUiServerImpl()
    ).setup(documentationEndpoint, app);
  }
}
