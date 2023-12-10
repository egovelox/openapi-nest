import readPackageUp from "read-pkg-up";
import { Module, Get, Controller } from "@nestjs/common";
import {
  OpenapiApiInfoPaths,
  OpenapiHealthResponse,
  OpenapiVersionResponse,
} from "../core/entity/openapi";

@Controller()
export class ApiInfoController {
  constructor() {}

  @Get(OpenapiApiInfoPaths.HEALTH)
  async check(): Promise<OpenapiHealthResponse> {
    return { status: "ok" };
  }

  @Get(OpenapiApiInfoPaths.VERSION)
  async version(): Promise<OpenapiVersionResponse> {
    try {
      const readPackage = await readPackageUp();
      if (!readPackage) {
        return { version: "not found" };
      }
      return { version: readPackage.packageJson.version };
    } catch (e) {
      return { version: "not found" };
    }
  }
}

@Module({
  imports: [],
  controllers: [ApiInfoController],
})
export class ApiInfoModule {}
