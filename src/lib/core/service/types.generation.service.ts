import { writeFileSync } from "fs";

import { OpenapiSchemaObjects, OpenapiController, Operation } from "../entity/openapi";
import { ConfigLoader } from "../port/config.loader";
import { OpenapiReader } from "../port/openapi.reader";
import { OpenapiTypesGenerator } from "../port/openapi.types.generator";
import { generatorNames } from "./nest.decorators.generator";

export class TypesGenerationService {
  constructor(
    private configLoader: ConfigLoader,
    private openapiReader: OpenapiReader,
    private typesGenerator: OpenapiTypesGenerator,
    private OPENAPI_TYPES_FILENAME = "raw.openapi.types.ts",
    private DERIVED_TYPES_FILENAME = "openapi.types.ts"
  ) {}

  async validateOpenapiFile() {
    const { openapiFilePath } = await this.configLoader.collectPackageJsonConfig();
    await this.openapiReader.validateFile(openapiFilePath);
  }

  async generateTsTypes(): Promise<string> {
    const { openapiFilePath, generationOutDir, supportNestRoutesURIVersioning } =
      await this.configLoader.collectPackageJsonConfig();

    if (generationOutDir === undefined) {
      return `✨ [openapi-nest] TS types generation is not enabled.\n`;
    }

    const openapiTypesFilePath = await this.typesGenerator.generateOpenapiTsTypes(
      openapiFilePath,
      `${generationOutDir}/${this.OPENAPI_TYPES_FILENAME}`
    );

    const derivedTypesFilePath = await this.generateDerivedTsTypes(
      openapiFilePath,
      `${generationOutDir}/${this.DERIVED_TYPES_FILENAME}`,
      supportNestRoutesURIVersioning ?? false
    );

    return [
      `✨ [openapi-nest] Successfully generated TS types from ${openapiFilePath} :`,
      `${openapiTypesFilePath}`,
      `${derivedTypesFilePath}\n`,
    ].join("\n");
  }

  private async generateDerivedTsTypes(
    openapiFilePath: string,
    derivedTypesFilePath: string,
    supportNestRoutesURIVersioning: boolean
  ) {
    const openapiCollected = await this.openapiReader.collectOperations(openapiFilePath);
    this.writeDerivedTypes(derivedTypesFilePath, openapiCollected, supportNestRoutesURIVersioning);
    return derivedTypesFilePath;
  }

  private writeDerivedTypes(
    derivedTypesFilePath: string,
    openapiCollected: OpenapiSchemaObjects,
    supportNestRoutesURIVersioning: boolean
  ): void {
    const { operations, controllers } = openapiCollected;
    const headLines = this.getHeadLines(supportNestRoutesURIVersioning);
    const controllersEnum = this.getControllersEnum(controllers);
    const decoratorDocumentation = [
      "/**",
      "* Custom Nest decorator to decorate a controller method",
      "* @param config - { controllerSegment: string } The controllerSegment string must be identical to the string that you pass in the nest Controller decorator. If used in a controller where the Controller decorator is empty, then controllerSegment should be an empty string.",
      "*/\n",
    ].join("\n");
    const types = operations.reduce((types, operation) => {
      return (
        types +
        this.getDerivedType(operation) +
        decoratorDocumentation +
        this.getDecorator(operation, supportNestRoutesURIVersioning)
      );
    }, "");

    writeFileSync(derivedTypesFilePath, headLines + controllersEnum + types, "utf8");
  }

  private getDecorator(operation: Operation, supportNestRoutesURIVersioning: boolean): string {
    const { controller, controllerPathSegment } = operation;
    const generatorName = supportNestRoutesURIVersioning
      ? generatorNames.versionedGeneratorName
      : generatorNames.generatorName;
    const generator = `export const ${this.unCapitalize(
      operation.operationId
    )} = ${generatorName}('${operation.httpMethod}', '${operation.path}', ${
      operation.successResponseCode
    })`;
    if (controller !== undefined && controllerPathSegment !== undefined) {
      return `${generator}({\ncontrollerSegment: Controllers.${controller.toUpperCase()}\n});\n`;
    } else {
      return `${generator};\n`;
    }
  }

  private getControllersEnum(controllers: OpenapiController[]) {
    const enumMembers = controllers
      .map(
        (controller) =>
          `${controller.name.toUpperCase()} = ${
            controller.pathSegment === undefined ? `''` : `'${controller.pathSegment}'`
          },`
      )
      .join("\n  ");

    return ["\nexport enum Controllers {", `  ${enumMembers}`, `};\n`].join("\n");
  }

  private getHeadLines(supportNestRoutesURIVersioning: boolean): string {
    const generatorName = supportNestRoutesURIVersioning
      ? generatorNames.versionedGeneratorName
      : generatorNames.generatorName;
    const generationWarning = [
      "/**",
      "* This file was auto-generated",
      "* Do not make direct changes to the file",
      "*/\n",
    ].join("\n");
    const importTypes = `import type { operations } from './${this.OPENAPI_TYPES_FILENAME.replace(
      ".ts",
      ""
    )}'\n`;
    const importDecorator = `import { ${generatorName} } from 'openapi-nest'\n`;
    return generationWarning + importTypes + importDecorator;
  }

  private getDerivedType(operation: Operation): string {
    const t = this.typesGenerator;
    const {
      operationId,
      successResponseCode,
      responseMediaType,
      requestBodyMediaType,
      hasPathParameters,
      hasQueryParameters,
    } = operation;

    return `
export type ${this.capitalize(operationId)} = {
  response : ${
    responseMediaType
      ? t.getResponseType(operationId, successResponseCode, responseMediaType)
      : "never"
  }
  params : ${hasPathParameters ? t.getParamsType(operationId) : "never"}
  query : ${hasQueryParameters ? t.getQueryType(operationId) : "never"}
  requestBody : ${
    requestBodyMediaType ? t.getRequestBodyType(operationId, requestBodyMediaType) : "never"
  }
};\n`;
  }

  private capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  private unCapitalize(str: string) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
}
