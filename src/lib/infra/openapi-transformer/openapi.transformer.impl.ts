import { OpenAPIV3 } from "openapi-types";
import { OpenapiTransformer, TransformerSuccess } from "../../core/port/openapi.transformer";
import { OpenapiTransformerConfigLoader } from "./openapi.transformer.config.loader";
import {
  ConfigOpenApiTransformationApiGatewayIntegration,
  ConfigOpenApiTransformationCorsOperation,
  ConfigOpenApiTransformationSecuritySchemesOperation,
} from "./types/internal";
import { Method } from "./types/public";

export class OpenapiTransformerImpl implements OpenapiTransformer {
  private openapiTransformerConfigLoader: OpenapiTransformerConfigLoader =
    new OpenapiTransformerConfigLoader();

  async transform(
    openapiFilePath: string,
    openapiDocument: OpenAPIV3.Document<{}>,
    transformConfigFilePath: string,
    name: string,
    version: string
  ): Promise<TransformerSuccess> {
    const { outputPath, dryRun, validateSchema, transformation, postTransform, preTransform } =
      await this.openapiTransformerConfigLoader.loadConfigModule(transformConfigFilePath);

    let document: OpenAPIV3.Document = openapiDocument;
    if (preTransform !== undefined) {
      try {
        document = preTransform(document, { name, version, openapiFilePath });
      } catch (e) {
        console.error("[OpenApi Operation] Could not pre-transform document.", e);
        process.exit(1);
      }
    }

    if (transformation !== undefined) {
      const corsUpdaterPerRoute = transformation.cors;
      if (corsUpdaterPerRoute !== undefined) {
        document = this.applyCORS(document, corsUpdaterPerRoute);
      }

      const securitySchemes = transformation.securitySchemes;
      if (securitySchemes !== undefined) {
        document = this.applySecurity(document, securitySchemes);
      }

      const apiGatewayIntegration = transformation.apiGatewayIntegration;
      if (apiGatewayIntegration !== undefined) {
        document = this.applyApiGatewayIntegration(document, apiGatewayIntegration);
      }
    }

    if (postTransform !== undefined) {
      try {
        document = postTransform(document, { name, version, openapiFilePath });
      } catch (e) {
        console.error("[OpenApi Operation] Could not post-transform document.", e);
        process.exit(1);
      }
    }

    return {
      transformedDocument: document,
      outputPath,
      dryRun: dryRun ?? false,
      shouldValidate: validateSchema ?? false,
    };
  }

  private applyCORS(
    document: OpenAPIV3.Document,
    corsUpdaterPerRoute: ConfigOpenApiTransformationCorsOperation
  ): OpenAPIV3.Document {
    const pathKeys = Object.keys(document.paths);
    pathKeys.map(function addCORSToPath(pathKey) {
      try {
        const currentPathObject: OpenAPIV3.PathItemObject | undefined = document.paths[pathKey];
        if (currentPathObject === undefined) {
          process.exit(1);
        }
        const httpMethods = Object.keys(currentPathObject) as Method[];
        const defaultOptionObject = {
          summary: "CORS",
          description: "",
          parameters: currentPathObject[httpMethods[0]]?.parameters || [],
          responses: {
            "200": {
              description: "ok",
              content: {},
              headers: {
                "Access-Control-Allow-Origin": {
                  schema: {
                    type: "string",
                  },
                },
                "Access-Control-Allow-Methods": {
                  schema: {
                    type: "string",
                  },
                },
                "Access-Control-Allow-Headers": {
                  schema: {
                    type: "string",
                  },
                },
                "Access-Control-Expose-Headers": {
                  schema: {
                    type: "string",
                  },
                },
              },
            },
          },
        };

        const optionObject = corsUpdaterPerRoute(pathKey, defaultOptionObject);
        if (optionObject !== false) {
          currentPathObject.options = optionObject;
        }
      } catch (e) {
        console.error(`Could not add CORS to route ${pathKey}\n`);
        throw e;
      }
    });
    return document;
  }

  private applySecurity(
    document: OpenAPIV3.Document,
    securitySchemesOptions: ConfigOpenApiTransformationSecuritySchemesOperation
  ): OpenAPIV3.Document {
    if (document.components === undefined) {
      console.error(
        "OpenApi document does not have a `components` object. Please add it to your file."
      );
      process.exit(1);
    } else {
      if (document.components.securitySchemes === undefined) {
        // We ignore the typing of securitySchemesOptions.scheme as we do not validate it.
        // TODO maybe validate the schema in the config
        // @ts-ignore
        document.components.securitySchemes = securitySchemesOptions.scheme;
      } else {
        console.info("`securitySchemes` already defined. Skipping securitySchemes assignation.");
      }

      const defaultRouteSecurityList = Object.keys(
        // document.components are guarenteed to be defined from the statement above
        // @ts-ignore
        document.components.securitySchemes
      ).map((security) => ({ [security]: [] }));

      const pathKeys = Object.keys(document.paths);
      pathKeys.map(function addSecurityToPath(pathKey) {
        try {
          const currentPathObject: OpenAPIV3.PathItemObject | undefined = document.paths[pathKey];
          if (currentPathObject === undefined) {
            process.exit(1);
          }
          const httpMethods = Object.keys(currentPathObject) as Method[];

          httpMethods.map((method) => {
            if (method.toLowerCase() !== "options") {
              const userSecurityObject = securitySchemesOptions.filterSecurity?.(
                pathKey,
                method,
                defaultRouteSecurityList
              );

              // False mean no security.
              // Object means custom security.
              // undefined means defaultSecurity
              if (userSecurityObject !== false) {
                ((currentPathObject[method] as OpenAPIV3.OperationObject) || {}).security =
                  userSecurityObject || defaultRouteSecurityList;
              }
            }
          });
        } catch (e) {
          console.error(`Could not add \`security\` to route ${pathKey}\n`);
          throw e;
        }
      });
    }

    return document;
  }

  private applyApiGatewayIntegration(
    document: OpenAPIV3.Document,
    apiGatewayIntegrationOptions: ConfigOpenApiTransformationApiGatewayIntegration
  ): OpenAPIV3.Document {
    document = this.applyRouteIntegration(
      document,
      apiGatewayIntegrationOptions.proxyBaseUrl,
      apiGatewayIntegrationOptions.routeIntegration
    );

    if (apiGatewayIntegrationOptions.securitySchemesExtensions !== undefined) {
      document = this.applySecurityExtensions(
        document,
        apiGatewayIntegrationOptions.securitySchemesExtensions
      );
    }

    if (apiGatewayIntegrationOptions.binaryMediaTypes !== undefined) {
      document = {
        ...document,
        // The openapi-types typings does not allow extensions (x-*)
        // @ts-ignore
        "x-amazon-apigateway-binary-media-types": apiGatewayIntegrationOptions.binaryMediaTypes,
      };
    }

    return document;
  }

  private applyRouteIntegration(
    document: OpenAPIV3.Document,
    proxyBaseUrl: string,
    routeIntegration: ConfigOpenApiTransformationApiGatewayIntegration["routeIntegration"]
  ): OpenAPIV3.Document {
    const pathKeys = Object.keys(document.paths);

    pathKeys.map((pathKey) => {
      try {
        const currentPathObject = document.paths[pathKey];
        if (currentPathObject === undefined) {
          process.exit(1);
        }
        const httpMethods = Object.keys(currentPathObject) as Method[];
        httpMethods.map((httpMethod) => {
          const pathParameters = (currentPathObject[httpMethod]?.parameters || []).filter(
            (pathParameter) => this.pathParameterFilter(pathParameter, pathKey, httpMethod)
          ) as OpenAPIV3.ParameterObject[];

          const defaultIntegration = this.makeApiGatewayIntegrationObject({
            method: httpMethod,
            // can't use path's methods here since they will break the scheme (http:// -> http:/)
            uri: proxyBaseUrl.replace(/\/$/, "") + "/" + pathKey.replace(/^\//, ""),
            pathParameters,
          });

          const integration = routeIntegration(
            { path: pathKey, method: httpMethod },
            defaultIntegration
          );

          // The openapi-types typings does not allow extensions (x-*)
          // @ts-ignore
          currentPathObject[httpMethod]["x-amazon-apigateway-integration"] = integration;
        });
      } catch (e) {
        console.error(`Could not add ApiGateway integration to route ${pathKey}\n`);
        throw e;
      }
    });

    return document;
  }

  private makeApiGatewayIntegrationObject({
    method,
    uri,
    pathParameters,
  }: {
    method: Method;
    uri: string;
    pathParameters: OpenAPIV3.ParameterObject[];
  }) {
    // TODO: check if required: false pathParameters should not be cached and proxied

    return {
      type: "http_proxy",
      httpMethod: method.toUpperCase(),
      uri,
      passthroughBehavior: "when_no_match",
      timeoutInMillis: null,
      cacheKeyParameters: pathParameters.map(
        (pathParameter) => `integration.request.path.${pathParameter.name}`
      ),
      requestParameters: pathParameters.reduce((requestParametersObject, pathParameter) => {
        return {
          ...requestParametersObject,
          [`integration.request.path.${pathParameter.name}`]: `method.request.path.${pathParameter.name}`,
        };
      }, {}),
    };
  }

  private isParameterObject(
    parameter: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject
  ): parameter is OpenAPIV3.ParameterObject {
    return parameter.hasOwnProperty("in");
  }

  private pathParameterFilter(
    parameter: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject,
    path: string,
    method: Method
  ): boolean {
    if (this.isParameterObject(parameter)) {
      return parameter.in === "path";
    } else {
      console.info(
        `${method.toUpperCase()} ${path}: Reference path parameters are not supported for ApiGatewayIntegration, skipping.`
      );
      return false;
    }
  }

  private applySecurityExtensions(
    document: OpenAPIV3.Document,
    securitySchemesExtensions: NonNullable<
      ConfigOpenApiTransformationApiGatewayIntegration["securitySchemesExtensions"]
    >
  ): OpenAPIV3.Document {
    if (document.components === undefined) {
      console.error(
        "OpenApi document does not have a `components` object. Please add it to your file."
      );
      process.exit(1);
    } else if (document.components.securitySchemes === undefined) {
      console.error(
        "OpenApi does not have `securitySchemes` defined. Cannot apply `securitySchemesExtensions`."
      );
      process.exit(1);
    } else {
      document.components.securitySchemes = Object.keys(securitySchemesExtensions).reduce(
        (securitySchemesObject, securitySchemesExtensionsKey) => {
          return {
            ...securitySchemesObject,
            [securitySchemesExtensionsKey]: {
              ...securitySchemesObject[securitySchemesExtensionsKey],
              ...(securitySchemesExtensions[securitySchemesExtensionsKey] || {}),
            },
          };
        },
        document.components.securitySchemes
      );
    }
    return document;
  }
}
