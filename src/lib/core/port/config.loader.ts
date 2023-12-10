import { Config } from "../entity/bootstrap.config";
export interface ConfigLoader {
  collectPackageJsonConfig(): Promise<Config>;
}
