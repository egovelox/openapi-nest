import path from "path";
import readPackageUp from "read-pkg-up";

import { PackageJsonSchema } from "../core/entity/bootstrap.package.json";
import { Config } from "../core/entity/bootstrap.config";
import { ConfigLoader } from "../core/port/config.loader";

export class ConfigLoaderImpl implements ConfigLoader {
  async collectPackageJsonConfig(): Promise<Config> {
    const { rootPath, packageJson } = await this.findPackageJson();
    const { openapiNest, name, version } = await this.validatePackageJsonConfig(packageJson);
    return {
      name,
      version,
      rootPath,
      openapiFilePath: openapiNest.openapiFilePath,
      transformConfigFilePath: openapiNest.openapiTransform?.transformConfigFilePath,
      generationOutDir: openapiNest.codeGen?.generationOutDir,
      supportNestRoutesURIVersioning: openapiNest.codeGen?.supportNestRoutesURIVersioning,
    };
  }

  private async findPackageJson() {
    const result = await this.getPackageJson();
    if (!result) {
      throw Error("Received 'undefined' while loading package.json");
    }
    return { rootPath: path.dirname(result.path), packageJson: result.packageJson };
  }

  private async validatePackageJsonConfig(json: unknown): Promise<PackageJsonSchema> {
    const validatedParams: PackageJsonSchema = await PackageJsonSchema.parseAsync(json);
    return validatedParams;
  }

  private async getPackageJson() {
    try {
      const packageJson = await readPackageUp({ cwd: process.cwd() });
      return packageJson;
    } catch (e) {
      throw Error(
        `Could not find any package.json in the root directory (folder containing .git/).`
      );
    }
  }
}
