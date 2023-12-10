"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const driver_1 = require("./controllers/driver");
const openapi_nest_1 = require("openapi-nest");
let AppModule = exports.AppModule = class AppModule {
    configure(consumer) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const validators = yield openapi_nest_1.IoValidation.getOpenapiValidators({
                useCognitoAdfsSecurityHandlers: true,
                openapiValidatorOptions: {
                    validateRequests: true,
                    validateResponses: true,
                },
            });
            consumer.apply(...validators).forRoutes("*");
        });
    }
};
exports.AppModule = AppModule = tslib_1.__decorate([
    (0, common_1.Module)({
        imports: [openapi_nest_1.ApiInfoModule, driver_1.DriverModule],
        controllers: [],
        providers: [{ provide: core_1.APP_FILTER, useClass: openapi_nest_1.IoValidationExceptionFilter }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map