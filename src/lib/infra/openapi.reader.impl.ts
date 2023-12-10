import SwaggerParser from "@apidevtools/swagger-parser";

import { OpenapiReader } from "../core/port/openapi.reader";
import {
  Operation,
  OpenAPIV3,
  OpenapiSchemaObjects,
  OpenapiController,
} from "../core/entity/openapi";

export class OpenapiReaderImpl implements OpenapiReader {
  async validateFile(filePath: string): Promise<void> {
    await SwaggerParser.validate(filePath);
    const api = (await SwaggerParser.parse(filePath)) as OpenAPIV3.Document;
    if (typeof api.openapi === undefined || !/^3\.0./.test(api.openapi)) {
      throw Error(`Error validating ${filePath} : openapi version must be >= 3.0.x`);
    }
  }

  async updateNameAndVersion(
    document: OpenAPIV3.Document<{}>,
    name: string,
    version: string
  ): Promise<OpenAPIV3.Document<{}>> {
    await this.validateDocument(document);
    return Object.freeze({ ...document, info: { ...document.info, title: name, version } });
  }

  async validateDocument(document: OpenAPIV3.Document): Promise<void> {
    await SwaggerParser.validate(document, { resolve: { external: true } });
    const api = (await SwaggerParser.parse(document)) as OpenAPIV3.Document;
    if (typeof api.openapi === undefined || !/^3\.0./.test(api.openapi)) {
      throw Error(`Error validating document : openapi version must be >= 3.0.x`);
    }
  }

  async read(filePath: string): Promise<OpenAPIV3.Document> {
    await this.validateFile(filePath);
    return (await SwaggerParser.dereference(filePath)) as OpenAPIV3.Document;
  }

  async collectOperations(filePath: string): Promise<OpenapiSchemaObjects> {
    const api = await SwaggerParser.parse(await this.read(filePath));

    if (!api.paths) {
      throw Error(`Error parsing ${filePath} : got undefined paths`);
    }

    const operations: Operation[] = [];

    for (const path in api.paths) {
      const pathOperations = api.paths[path] as Record<string, OpenAPIV3.OperationObject>;
      for (const method in pathOperations) {
        const { operationId, responses, requestBody, parameters } = pathOperations[method];
        const controller = (pathOperations[method] as any)["x-openapi-nest-controller"] as
          | string
          | undefined;
        const controllerPathSegment = (pathOperations[method] as any)[
          "x-openapi-nest-controller-path-segment"
        ] as string | undefined;

        if (!operationId) {
          throw Error(`Error parsing ${filePath} : Path ${path}/${method} requires an operationId`);
        }

        const successResponseCodes = Object.keys(responses).filter((code) => code.startsWith("2"));
        if (successResponseCodes.length !== 1) {
          throw Error(
            `Error parsing ${filePath} : OperationId ${operationId} requires a unique 2** response`
          );
        }

        const responseMediaType = this.responseMediaType(responses[successResponseCodes[0]]);
        const requestBodyMediaType = this.requestBodyMediaType(requestBody);
        const { hasPathParameters, hasQueryParameters } = this.hasPathQueryParameters(parameters);

        operations.push({
          path,
          operationId,
          httpMethod: method,
          responseMediaType,
          successResponseCode: successResponseCodes[0],
          requestBodyMediaType,
          hasPathParameters,
          hasQueryParameters,
          controllerPathSegment,
          controller,
        });
      }
    }

    if (this.hasDuplicates(operations.map((o) => o.operationId))) {
      throw Error(`Error parsing ${filePath} : found duplicated operationIds`);
    }

    const controllers: OpenapiController[] = [];
    operations.map((operation, idx, ops) => {
      if (operation !== undefined && operation.controller !== undefined) {
        const someIdx = ops.map((o) => o.controller).indexOf(operation.controller);
        if (idx !== someIdx) {
          if (operation.controllerPathSegment !== ops[someIdx].controllerPathSegment) {
            throw Error(
              [
                `Error parsing ${filePath}: `,
                `One controller cannot have different values of controller-path-segment: \`${operation.controller}\``,
              ].join("")
            );
          }
        }
        controllers.push({
          name: operation.controller,
          pathSegment: operation.controllerPathSegment,
        });
      }
    });

    return {
      controllers: [...new Map(controllers.map((c) => [c.name, c])).values()],
      operations,
    };
  }

  private responseMediaType(
    response: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject
  ): string | undefined {
    if ("content" in response && response.content) {
      return Object.keys(response.content)[0];
    }
    return undefined;
  }

  private requestBodyMediaType(
    requestBody: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject | undefined
  ): string | undefined {
    if (requestBody && "content" in requestBody) {
      return Object.keys(requestBody.content)[0];
    }

    return undefined;
  }

  private hasPathQueryParameters(
    parameters: (OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject)[] | undefined
  ): {
    hasPathParameters: boolean;
    hasQueryParameters: boolean;
  } {
    const pathQueryParameters = { hasPathParameters: false, hasQueryParameters: false };
    parameters?.forEach((param) => {
      if ("in" in param) {
        if (param.in === "path") {
          pathQueryParameters.hasPathParameters = true;
        } else if (param.in === "query") {
          pathQueryParameters.hasQueryParameters = true;
        }
      }
    });
    return pathQueryParameters;
  }

  private hasDuplicates(array: string[]): boolean {
    return array.some((item, idx, arr) => arr.indexOf(item) !== idx);
  }
}
