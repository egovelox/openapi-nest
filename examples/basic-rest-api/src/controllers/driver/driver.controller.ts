import { User, UserInfo } from "openapi-nest";
import {
  Body,
  Controller,
  NotFoundException,
  Param,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import {
  AddDriverImage,
  addDriverImage,
  Controllers,
  GetAllDrivers,
  getAllDrivers,
  getDriverById,
  GetDriverById,
  SearchDrivers,
  searchDrivers,
} from "../../generated/openapi.types";
import { Express } from "express";
import { FileInterceptor } from "@nestjs/platform-express";

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
    @Body() body: SearchDrivers["requestBody"]
  ): Promise<SearchDrivers["response"]> {
    return {
      drivers: driversDB.filter(
        (d) =>
          new RegExp(`${body.searchTerm}`).test(d.firstname) ||
          new RegExp(`${body.searchTerm}`).test(d.lastname)
      ),
    };
  }

  @addDriverImage
  @UseInterceptors(FileInterceptor("file"))
  async addDriverImage(
    @Param() params: AddDriverImage["params"],
    @UploadedFile() file: Express.Multer.File
  ): Promise<AddDriverImage["response"]> {
    console.log('params', params)
    console.log("file", file);
    return { driver_id: params.id.toString() };
  }
}
