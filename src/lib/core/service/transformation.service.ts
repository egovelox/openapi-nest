import { writeFileSync, existsSync, mkdirSync } from "fs";
import { ConfigLoader } from "../port/config.loader";
import { OpenapiReader } from "../port/openapi.reader";
import { OpenapiTransformer } from "../port/openapi.transformer";
import { OpenAPIV3 } from "openapi-types";
import path from "path";

export class TransformationService {
  constructor(
    private configLoader: ConfigLoader,
    private openapiReader: OpenapiReader,
    private openapiTranformer: OpenapiTransformer
  ) {}

  async transformOpenapiFile(): Promise<string> {
    const { openapiFilePath, transformConfigFilePath, name, version } =
      await this.configLoader.collectPackageJsonConfig();
    if (transformConfigFilePath === undefined) {
      return `✨ [openapi-nest] Openapi file transformation is not enabled.\n`;
    }
    const document = await this.openapiReader
      .read(openapiFilePath)
      .then((doc) => this.openapiReader.updateNameAndVersion(doc, name, version));

    const { transformedDocument, outputPath, dryRun, shouldValidate } =
      await this.openapiTranformer.transform(
        openapiFilePath,
        document,
        transformConfigFilePath,
        name,
        version
      );

    if (shouldValidate) {
      await this.openapiReader.validateDocument(transformedDocument);
    }

    if (dryRun) {
      return [
        `✨ [openapi-nest] Successfully transformed ${openapiFilePath} :`,
        `Did not generated ${outputPath} (dry run)\n`,
      ].join("\n");
    }

    this.checkOrCreateFolder(outputPath);
    this.writeTransformedDocument(outputPath, transformedDocument);

    return [
      `✨ [openapi-nest] Successfully transformed ${openapiFilePath} :`,
      `${outputPath}\n`,
    ].join("\n");
  }

  checkOrCreateFolder(outputPath: string, deep = false) {
    const outputDir = path.dirname(outputPath);
    return existsSync(outputPath) || mkdirSync(outputDir, { recursive: deep });
  }

  writeTransformedDocument(outputPath: string, document: OpenAPIV3.Document) {
    writeFileSync(outputPath, JSON.stringify(document, null, 2));
  }
}
