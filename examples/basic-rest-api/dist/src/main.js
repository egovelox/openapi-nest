"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const openapi_nest_1 = require("openapi-nest");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
function bootstrap() {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const app = yield core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: true });
        const globalPrefix = "api";
        app.setGlobalPrefix(globalPrefix);
        yield openapi_nest_1.OpenapiSwagger.setup(`/${globalPrefix}/documentation`, app);
        const port = process.env.PORT || 3000;
        yield app.listen(port);
        console.info(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
    });
}
bootstrap().catch((error) => console.error(error));
//# sourceMappingURL=main.js.map