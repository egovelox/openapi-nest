export interface OpenapiTypesGenerator {
  generateOpenapiTsTypes(openapiFilePath: string, generatedFilePath: string): Promise<string>;
  getResponseType(
    operationId: string,
    successReponseCode: string,
    responseMediaType: string
  ): string;
  getParamsType(operationId: string): string;
  getQueryType(operationId: string): string;
  getRequestBodyType(operationId: string, requestBodyMediaType: string): string;
}
