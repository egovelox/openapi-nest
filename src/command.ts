#!/usr/bin/env node

import { ConfigLoaderImpl } from "./lib/infra/config.loader.impl";
import { OpenapiTypesGeneratorImpl } from "./lib/infra/openapi.types.generator.impl";
import { OpenapiTransformerImpl } from "./lib/infra/openapi-transformer/openapi.transformer.impl";
import { TypesGenerationService } from "./lib/core/service/types.generation.service";
import { TransformationService } from "./lib/core/service/transformation.service";
import { OpenapiReaderImpl } from "./lib/infra/openapi.reader.impl";

const configLoader = new ConfigLoaderImpl();
const openapiReader = new OpenapiReaderImpl();

const typesGenerationService = new TypesGenerationService(
  configLoader,
  openapiReader,
  new OpenapiTypesGeneratorImpl()
);

const transformationService = new TransformationService(
  configLoader,
  openapiReader,
  new OpenapiTransformerImpl()
);

typesGenerationService
  .validateOpenapiFile()
  .then((_) => typesGenerationService.generateTsTypes())
  .then((result) => console.info(result))
  .then((_) => transformationService.transformOpenapiFile())
  .then((result) => console.info(result));
