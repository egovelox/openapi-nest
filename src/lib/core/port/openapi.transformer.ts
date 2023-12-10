import { OpenAPIV3 } from "../entity/openapi";

export type TransformerSuccess = {
  transformedDocument: OpenAPIV3.Document;
  shouldValidate: boolean;
  dryRun: boolean;
  outputPath: string;
};

export interface OpenapiTransformer {
  transform(
    openapiFilePath: string,
    openapiDocument: OpenAPIV3.Document,
    transformConfigFilePath: string,
    name: string,
    version: string
  ): Promise<TransformerSuccess>;
}
