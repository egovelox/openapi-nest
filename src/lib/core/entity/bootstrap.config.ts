export type Config = {
  name: string;
  version: string;
  rootPath: string;
  openapiFilePath: string;
  transformConfigFilePath: string | undefined;
  generationOutDir: string | undefined;
  supportNestRoutesURIVersioning: boolean | undefined;
};
