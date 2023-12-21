import { Module, MiddlewareConsumer } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { DriverModule } from "./controllers/driver";
import { ApiInfoModule, IoValidation, IoValidationExceptionFilter } from "openapi-nest";

@Module({
  imports: [ApiInfoModule, DriverModule],
  controllers: [],
  providers: [{ provide: APP_FILTER, useClass: IoValidationExceptionFilter }],
})
export class AppModule {
  async configure(consumer: MiddlewareConsumer) {
    const validators = await IoValidation.getOpenapiValidators({
      useCognitoAdfsSecurityHandlers: true,
      openapiValidatorOptions: {
        validateRequests: true,
        validateResponses: true,
      },
    });
    consumer
      .apply(...validators)
      .forRoutes("*");
  }
}
