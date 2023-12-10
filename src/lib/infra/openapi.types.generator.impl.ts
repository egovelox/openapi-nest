import openapiTS from "openapi-typescript";
import { writeFileSync } from "fs";

import { OpenapiTypesGenerator } from "../core/port/openapi.types.generator";

export class OpenapiTypesGeneratorImpl implements OpenapiTypesGenerator {
  async generateOpenapiTsTypes(openapiFilePath: string, openapiGeneratedTypesFilePath: string) {
    const generatedTypes = await openapiTS(openapiFilePath);
    writeFileSync(openapiGeneratedTypesFilePath, generatedTypes, "utf8");
    return openapiGeneratedTypesFilePath;
  }

  getResponseType(operationId: string, successResponseCode: string, responseMediaType: string) {
    return `operations['${operationId}']['responses']['${successResponseCode}']['content']['${responseMediaType}']`;
  }

  getParamsType(operationId: string) {
    return `operations['${operationId}']['parameters']['path']`;
  }

  getQueryType(operationId: string) {
    return `operations['${operationId}']['parameters']['query']`;
  }

  getRequestBodyType(operationId: string, requestBodyMediaType: string) {
    return `operations['${operationId}']['requestBody']['content']['${requestBodyMediaType}']`;
  }
}
