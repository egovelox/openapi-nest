# OPENAPI-NEST

A node command and a typescript library for building **OPENAPI SCHEMA-FIRST** [Nest](https://www.npmjs.com/package/@nestjs/common) web apis 🚀

**WARNING**
- Needs ``node`` >= 18.16.1
- Needs ``nest`` and ``express``, no support for ``nest`` and ``fastify`` yet 🥲.

## Why ?

In an openapi-schema-first approach, the **source of truth is the schema**, not the code you write. The code should derive from the schema, which is not so easy to achieve in standard Nest applications. This library aims at bridging the gap for many folks used to schema-first design.

**Try it, if you expect to :**

1. Get rid of the hassle of writing your request and response DTOs.

   Instead we generate them with [openapi-typescript](https://www.npmjs.com/package/openapi-typescript).

2. Get rid of the hassle of validating these DTOs.

   Instead we'll have them auto-validated with [express-openapi-validator](https://www.npmjs.com/package/express-openapi-validator).

3. Get rid of the hassle of writing your swagger docs with decorators.

   Instead allow your team to write and validate a ``yaml`` openapi spec prior to coding it. 
   Then your swagger documentation can be published thanks to [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express).

4. Have the possibility to script transformations of your spec, e.g to deploy it on various API-gateway formats.

   we use [swagger-parser](https://www.npmjs.com/package/@apidevtools/swagger-parser)


**But don't try it yet, if you expect to :**

1. Keep a full and complex usage of [Nest routes versionning](https://docs.nestjs.com/techniques/versioning)


## How ?

Below is an example of a dummy nest controller.

Notice the use of **generated** types and decorators : 
They ensure the correspondance with your openapi schema (**source of truth**).

That means that you can now remove all your hand-written i/o types and validation : 

instead, thanks to ``openapi-express-validator``  you safely rely on your openapi-schema
to validate i/o via a middleware (see [app.module.ts](https://github.com/egovelox/openapi-nest/blob/main/examples/basic-rest-api/src/app.module.ts)).

```typescript
import { Controller, NotFoundException, Param } from "@nestjs/common";
import {
  Controllers,
  GetAllDrivers,
  getAllDrivers,
  getDriverbyId,
  GetDriverbyId,
} from "../../generated/operations.types";

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

  @getDriverbyId
  async getDriverById(
    @Param() params: GetDriverbyId["params"]
  ): Promise<GetDriverbyId["response"]> {
    const driver = driversDB.find((c) => c.driverId === params.id);
    if (driver === undefined) {
      throw new NotFoundException("Driver not found");
    }
    return driver;
  }
}
```
## Usage

```bash

$ openapi-nest

```

```typescript

import { ... } from 'openapi-nest'

```

See ``examples`` folder for a detailed usage.

Also you can launch an example server :

```bash

$ npm install && cd examples/basic-rest-api

$ npm install && npm run start

```

## Acknowledgement

[openapi-typescript](https://github.com/drwpow/openapi-typescript)

[express-openapi-validator](https://github.com/cdimascio/express-openapi-validator)

[swagger-parser](https://github.com/APIDevTools/swagger-parser)

## License

[MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE)

