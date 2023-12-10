import {
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Head,
  Options,
  HttpCode,
  Version,
  applyDecorators,
} from "@nestjs/common";

export const generatorNames = {
  generatorName: "nestDecoratorsGenerator",
  versionedGeneratorName: "nestVersionedDecoratorsGenerator",
};

/**
 * @remarks
 * Generates a custom Route decorator :
 * - this decorator is named after the openapi route operationId.
 * - behind the scenes, this decorator returns
 *   - a Method decorator
 *   - a HttpCode decorator
 *   - a Version decorator (only if the openapi route does have a leading v1,v2, or v3 etc)
 **/
export function nestVersionedDecoratorsGenerator<T extends PathKey>(
  openapiMethod: PathMethod<T>,
  openapiPath: T,
  openapiResponseOkHttpCode: number
) {
  return <S extends string>(config: { controllerSegment: VersionedControllerPath<S, T> }) => {
    const [routeVersion] = /^\/v[\d]+/.exec(openapiPath) ?? [undefined];
    const decoratorPath = buildValidDecoratorPath(
      config.controllerSegment,
      openapiPath,
      routeVersion
    );
    let methodDecorator = getMethodDecorator(openapiMethod);
    if (routeVersion) {
      return applyDecorators(
        methodDecorator(decoratorPath),
        Version(routeVersion.replace("/v", "")),
        HttpCode(openapiResponseOkHttpCode)
      );
    } else {
      return applyDecorators(methodDecorator(decoratorPath), HttpCode(openapiResponseOkHttpCode));
    }
  };
}

/**
 * @remarks
 * Generates a custom Route decorator :
 * - this decorator is named after the openapi route operationId.
 * - behind the scenes, this decorator returns
 *   - a Method decorator
 *   - a HttpCode decorator
 */
export function nestDecoratorsGenerator<T extends PathKey>(
  openapiMethod: PathMethod<T>,
  openapiPath: T,
  openapiResponseOkHttpCode: number
) {
  return <S extends string>(config: { controllerSegment: ControllerPath<S, T> }) => {
    const decoratorPath = buildValidDecoratorPath(config.controllerSegment, openapiPath);
    let methodDecorator = getMethodDecorator(openapiMethod);
    return applyDecorators(methodDecorator(decoratorPath), HttpCode(openapiResponseOkHttpCode));
  };
}

function getMethodDecorator<T extends PathKey>(
  openapiMethod: PathMethod<T>
): (path: string) => MethodDecorator {
  switch (openapiMethod as keyof PathItem) {
    case "get":
      return Get;
    case "post":
      return Post;
    case "put":
      return Put;
    case "patch":
      return Patch;
    case "delete":
      return Delete;
    case "head":
      return Head;
    case "options":
      return Options;
  }
}

type Object<T> = {
  [key: string]: T;
};

/* A PathItem can have multiple methods
 * e.g :
 *
 * /a/path/item:
 *   get:
 *     ...
 *   post:
 *     ...
 */
type PathItem = {
  get?: any;
  post?: any;
  put?: any;
  patch?: any;
  delete?: any;
  head?: any;
  options?: any;
};

/* A PathList can have multiple PathItems
 * e.g
 * paths:
 *   /a/first/path/item
 *    ...
 *   /a/second/path/item
 */
type PathList = Object<PathItem>;

/* A PathKey is the string that defines a PathItem
 *
 * /a/path/item is the PathKey of the PathItem above
 *
 */
type PathKey = Extract<keyof PathList, string>;

type PathMethod<T extends PathKey> = keyof PathList[T];

/*
 * Banned types
 */
type Curlybrace = `${string}${"{"}${string}`;
type Parenthesis = `${string}${"("}${string}`;
type Star = `${string}${"*"}${string}`;
type QuestionMark = `${string}${"?"}${string}`;
type Plus = `${string}${"+"}${string}`;
type Banned = Curlybrace | Parenthesis | Star | QuestionMark | Plus;

/**
 * This type enforces that a controller path :
 * - does not contain any Banned characters
 * - is not of type string (i.e only of type literal-string)
 * - is a substring of a generated openapi path (PathKey), or an empty string
 **/
type VersionedControllerPath<T extends string, P extends PathKey> = T extends Banned
  ? never
  : string extends T
  ? never
  : P extends `/${T}` | `/v${number}/${T}` | `/v${number}/${T}/${string}`
  ? T
  : "" extends T
  ? T
  : never;

type ControllerPath<T extends string, P extends PathKey> = T extends Banned
  ? never
  : string extends T
  ? never
  : P extends `/${T}` | `/${T}/${string}`
  ? T
  : "" extends T
  ? T
  : never;

function formatPathParams(path: string) {
  return path.replace(/{/g, ":").replace(/}/g, "");
}

function buildValidDecoratorPath(
  controllerPath: string,
  openapiPath: string,
  routeVersion?: string
) {
  let decoratorPath: string;
  if (routeVersion) {
    decoratorPath = openapiPath.replace(`${routeVersion}/${controllerPath}`, "");
  } else {
    decoratorPath = openapiPath.replace(`/${controllerPath}`, "");
  }
  return formatPathParams(decoratorPath);
}
