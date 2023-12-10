import { cosmiconfig } from "cosmiconfig";
import {
  ConfigModuleObject,
  OpenApiTransformationApiGatewayIntegrationOperation,
  OpenApiTransformationOperation,
  OpenApiTransformationSecuritySchemeOperation,
} from "./types/public";

export class OpenapiTransformerConfigLoader {
  async loadConfigModule(transformConfigFilePath: string) {
    const module = await cosmiconfig("").load(transformConfigFilePath);

    if (module === null) {
      console.error(`Could not find a valid configuration.`);
      process.exit(1);
    } else if (module.isEmpty === true) {
      console.error(`The configuration is empty. (path: ${module.filepath})`);
      process.exit(1);
    } else if (module.config === undefined) {
      console.error(
        `An unknown error occured when loading the config file. (path: ${module.filepath})`
      );
      process.exit(1);
    } else if (typeof module.config !== "function") {
      console.error(`The configuration object is not a function. (path: ${module.filepath})`);
      process.exit(1);
    } else {
      const moduleFn = module.config as () => Partial<ConfigModuleObject>;
      return this.validateConfig(moduleFn());
    }
  }

  private async validateConfig(config: Partial<ConfigModuleObject>): Promise<ConfigModuleObject> {
    if (config.outputPath === undefined || typeof config.outputPath !== "string") {
      console.error(`\`outputPath\` must be a string`);
      process.exit(1);
    }

    if (config.dryRun !== undefined && typeof config.dryRun !== "boolean") {
      console.error(`\`dryRun\` must be a boolean.`);
      process.exit(1);
    }

    if (config.validateSchema !== undefined && typeof config.validateSchema !== "boolean") {
      console.error(`\`validateSchema\` must be a boolean.`);
      process.exit(1);
    }

    if (config.preTransform !== undefined && typeof config.preTransform !== "function") {
      console.error(`\`preTransform\` must be a function.`);
      process.exit(1);
    }
    if (config.postTransform !== undefined && typeof config.postTransform !== "function") {
      console.error(`\`postTransform\` must be a function.`);
      process.exit(1);
    }
    const transformation = config.transformation;
    if (transformation !== undefined) {
      if (typeof transformation !== "object") {
        console.error(`\`transformation\` must be an object.`);
        process.exit(1);
      } else {
        this.validateTransformation(transformation);
      }
    }

    const validatedConfig: ConfigModuleObject = {
      ...config,
      outputPath: config.outputPath,
    };

    return validatedConfig;
  }

  private validateTransformation(transformation: OpenApiTransformationOperation) {
    if (
      transformation.cors !== undefined &&
      (typeof transformation.cors !== "function" || transformation.cors.length < 2)
    ) {
      console.error(
        `\`openapi.transformation.cors\` must be a function which accepts two arguments.`
      );
      process.exit(1);
    }

    if (transformation.securitySchemes !== undefined) {
      if (typeof transformation.securitySchemes !== "object") {
        console.error(`\`openapi.transformation.securitySchemes\` must be an object.`);
        process.exit(1);
      } else {
        this.validateSecuritySchemes(transformation.securitySchemes);

        if (transformation.apiGatewayIntegration !== undefined) {
          if (typeof transformation.apiGatewayIntegration !== "object") {
            console.error(`\`openapi.transformation.apiGatewayIntegration\` must be an object.`);
            process.exit(1);
          } else {
            this.validateApiGatewayIntegration(
              transformation.apiGatewayIntegration,
              transformation.securitySchemes
            );
          }
        }
      }
    }
  }

  private validateSecuritySchemes(securitySchemes: OpenApiTransformationSecuritySchemeOperation) {
    if (securitySchemes.scheme === undefined || typeof securitySchemes.scheme !== "object") {
      console.error(
        `\`transformation.securitySchemes.scheme\` is a required property and must be an object.`
      );
      process.exit(1);
    }

    if (Object.keys(securitySchemes.scheme).length === 0) {
      console.error(
        `\`transformation.securitySchemes.scheme[schemeKey]\` requires at least one security scheme.`
      );
      process.exit(1);
    }

    const invalidSecuritySchemeKeys = Object.keys(securitySchemes.scheme).filter(
      (key) => typeof securitySchemes.scheme[key] !== "object"
    );

    if (invalidSecuritySchemeKeys.length > 0) {
      console.error(
        `\`transformation.securitySchemes.scheme[schemeKey]\` must be an object.\nInvalid schemeKey: \`${invalidSecuritySchemeKeys.join(
          "`, `"
        )}\``
      );
      process.exit(1);
    }

    if (
      securitySchemes.filterSecurity !== undefined &&
      (typeof securitySchemes.filterSecurity !== "function" ||
        securitySchemes.filterSecurity.length > 3)
    ) {
      console.error(
        `\`transformation.securitySchemes.filterSecurity\` must be a function which accepts three arguments.`
      );
      process.exit(1);
    }
  }

  private validateApiGatewayIntegration(
    apiGatewayIntegration: OpenApiTransformationApiGatewayIntegrationOperation,
    securitySchemes: OpenApiTransformationSecuritySchemeOperation
  ) {
    if (typeof apiGatewayIntegration.proxyBaseUrl !== "string") {
      console.error(`\`transformation.apiGatewayIntegration.proxyBaseUrl\` is a required string.`);
      process.exit(1);
    }

    if (
      typeof apiGatewayIntegration.routeIntegration !== "function" ||
      apiGatewayIntegration.routeIntegration.length > 2
    ) {
      console.error(
        `\`transformation.apiGatewayIntegration.routeIntegration\` is a required function which accepts two arguments.`
      );
      process.exit(1);
    }

    const securitySchemesExtensions = apiGatewayIntegration.securitySchemesExtensions;
    if (securitySchemesExtensions !== undefined && typeof securitySchemesExtensions !== "object") {
      console.error(
        `\`transformation.apiGatewayIntegration.securitySchemesExtensions\` must be an object.`
      );
      process.exit(1);
    }

    if (securitySchemesExtensions !== undefined) {
      const availableSecuritySchemes = Object.keys(securitySchemes.scheme);
      const securitySchemesWithExtensions = Object.keys(securitySchemesExtensions);

      const extensionsWithNonAvailableSecurity = securitySchemesWithExtensions.filter(
        (securityScheme) => !availableSecuritySchemes.includes(securityScheme)
      );
      if (extensionsWithNonAvailableSecurity.length > 0) {
        const plurialSentence =
          extensionsWithNonAvailableSecurity.length === 1
            ? "is not an available scheme"
            : "are not available schemes";
        console.error(
          `\`transformation.apiGatewayIntegration.securitySchemesExtensions[scheme]\` must have schemes defined in \`openapi.transformation.securitySchemes[scheme]\`.\n\`${extensionsWithNonAvailableSecurity.join(
            "`, `"
          )}\` ${plurialSentence}.\nAvailable schemes: \`${availableSecuritySchemes.join(
            "`, `"
          )}\`.`
        );
        process.exit(1);
      }
    }

    if (
      apiGatewayIntegration.binaryMediaTypes !== undefined &&
      (!Array.isArray(apiGatewayIntegration.binaryMediaTypes) ||
        apiGatewayIntegration.binaryMediaTypes.some((value) => typeof value !== "string"))
    ) {
      console.error(
        `\`openapi.transformation.apiGatewayIntegration.binaryMediaTypes\` must be an array of strings.`
      );
      process.exit(1);
    }
  }
}
