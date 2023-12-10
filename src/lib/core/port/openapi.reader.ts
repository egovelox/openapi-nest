import { OpenAPIV3, OpenapiSchemaObjects, Operation } from "../entity/openapi";

export interface OpenapiReader {
  validateFile(filePath: string): Promise<void>;
  validateDocument(document: OpenAPIV3.Document): Promise<void>;
  read(filePath: string): Promise<OpenAPIV3.Document>;
  updateNameAndVersion(
    document: OpenAPIV3.Document,
    name: string,
    version: string
  ): Promise<OpenAPIV3.Document>;
  collectOperations(filePath: string): Promise<OpenapiSchemaObjects>;
}
