import { User, UserInfo } from "openapi-nest";
import { Controller, NotFoundException, Param, Query } from "@nestjs/common";
import {
  Controllers,
  GetAllDrivers,
  getAllDrivers,
  getDriverById,
  GetDriverById,
  SearchDrivers,
  searchDrivers,
} from "../../generated/openapi.types";

const driversDB = [
  { driverId: "1", firstname: "Enzo", lastname: "Ferrari" },
  { driverId: "2", firstname: "Ayrton", lastname: "Senna" },
  { driverId: "3", firstname: "Michel", lastname: "Vaillant" },
  { driverId: "4", firstname: "Michael", lastname: "Schumacher" },
  { driverId: "5", firstname: "Lewis", lastname: "Hamilton" },
];

@Controller(Controllers.DRIVERS)
export class DriverController {
  @getAllDrivers
  async getAllDrivers(): Promise<GetAllDrivers["response"]> {
    return { drivers: driversDB };
  }

  @getDriverById
  async getDriverById(@Param() param: GetDriverById["params"]): Promise<GetDriverById["response"]> {
    const driver = driversDB.find((c) => c.driverId === param.id);
    if (driver === undefined) {
      throw new NotFoundException("Driver not found");
    }
    return driver;
  }

  @searchDrivers
  async SearchDrivers(
    @User() user: UserInfo,
    @Query() query: SearchDrivers["query"]
  ): Promise<SearchDrivers["response"]> {
    console.log(user.userId);
    return {
      drivers: driversDB.filter(
        (d) =>
          new RegExp(`${query.term}`).test(d.firstname) ||
          new RegExp(`${query.term}`).test(d.lastname)
      ),
    };
  }
}
