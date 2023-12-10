/**
 * This is not a production server !
 *
 */
import { NestExpressApplication } from "@nestjs/platform-express";
import { OpenapiSwagger } from "openapi-nest";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  const globalPrefix = "api";
  app.setGlobalPrefix(globalPrefix);

  await OpenapiSwagger.setup(`/${globalPrefix}/documentation`, app);
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.info(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap().catch((error) => console.error(error));
