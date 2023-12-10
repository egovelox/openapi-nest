import { z } from "zod";

export const PackageJsonSchema = z.object({
  name: z.string(),
  version: z.string(),
  openapiNest: z.object({
    openapiFilePath: z.string(),
    codeGen: z.optional(
      z.object({
        generationOutDir: z.string(),
        supportNestRoutesURIVersioning: z.boolean().optional(),
      })
    ),
    openapiTransform: z.optional(
      z.object({
        transformConfigFilePath: z.string(),
      })
    ),
  }),
});

export type PackageJsonSchema = z.infer<typeof PackageJsonSchema>;
