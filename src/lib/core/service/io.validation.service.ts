import { middleware } from "express-openapi-validator";
import { Config } from "../entity/bootstrap.config";
import { ConfigLoader } from "../port/config.loader";
import { IoValidationOptions } from "../entity/openapi";

export class IoValidationService {
  constructor(private configLoader: ConfigLoader) {}

  async getOpenapiValidators(config?: IoValidationOptions) {
    const packageJsonParams: Config = await this.configLoader.collectPackageJsonConfig();

    return middleware({
      apiSpec: packageJsonParams.openapiFilePath,
      ...config?.openapiValidatorOptions,
    });

    /*
      validateRequests: true,
      validateResponses: false,
      // See documentation @ https://ajv.js.org/packages/ajv-formats.html
      validateFormats: true,
      ajvFormats: { mode: "full" },
      validateSecurity: this.validateSecurity(),
    */
  }
}
