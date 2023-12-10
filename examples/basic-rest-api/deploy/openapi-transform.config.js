module.exports = function () {
  return {
    outputPath: "deploy/generated/apigateway.json.tpl",
    dryRun: false,
    transformation: {
      cors: (path, cors) => cors,
      apiGatewayIntegration: {
        proxyBaseUrl: "${LB_URL}",
        routeIntegration: (route, extension) => extension,
        securitySchemesExtensions: {
          cognito: {
            "x-amazon-apigateway-authtype": "cognito_user_pools",
            "x-amazon-apigateway-authorizer": {
              type: "cognito_user_pools",
              providerARNs: ["${COGNITO_ARN}"],
            },
          },
          adfs: {
            type: "apiKey",
            name: "Authorization",
            in: "header",
            "x-amazon-apigateway-authtype": "custom",
            "x-amazon-apigateway-authorizer": {
              authorizerUri: "arn:aws:apigateway:eu-central-1:lambda:path/2015-03-31/functions/arn:aws:lambda:eu-central-1:${AWS_ACCOUNT_ID}:function:MyAuthorizer/invocations",
              type: "token",
              authorizerResultTtlInSeconds: 300
            }
          }
        },
      },
    },
    preTransform: (input, config) => {
      const docPath = {
          "/openapi-nest-example/documentation": {
              get: {
                  tags: ["appInfo"],
                  operationId: "documentation",
                  responses: {
                      "200": {
                          description: "Endpoint used to serve open api documentation",
                      },
                  },
              },
          },
        "/openapi-nest-example/async_documentation": {
          get: {
            tags: ["appInfo"],
            operationId: "async_documentation",
            responses: {
              "200": {
                description: "Endpoint used to serve async api documentation",
              },
            },
          },
        },
          "/openapi-nest-example/documentation/json": {
              get: {
                  tags: ["appInfo"],
                  operationId: "documentation",
                  responses: {
                      "200": {
                          description: "Endpoint used to serve open api documentation",
                      },
                  },
              },
          },
      }
      return {
        ...input,
        paths: {...input.paths, ...docPath},
      }
    }
  }
}

function buildAssetsGatewayIntegration(pathsWithNoPrefixes) {
  const gatewayIntegration =  {
    "uri": "${LB_URL}/openapi-nest-example/documentation/static/{assetPath}",
    "httpMethod": "GET",
    "requestParameters": {
      "integration.request.path.assetPath": "method.request.path.assetPath"
    },
    "passthroughBehavior": "when_no_match",
    "timeoutInMillis": 29000,
    "type": "http_proxy"
  }

  const asyncGatewayIntegration =  {
    "uri": "${LB_URL}/openapi-nest-example/async_documentation/{asyncAssetPath}",
    "httpMethod": "GET",
    "requestParameters": {
      "integration.request.path.asyncAssetPath": "method.request.path.asyncAssetPath"
    },
    "passthroughBehavior": "when_no_match",
    "timeoutInMillis": 29000,
    "type": "http_proxy"
  }

  const assetOptions = {...pathsWithNoPrefixes["/documentation"]["options"],
    "x-amazon-apigateway-integration": {...pathsWithNoPrefixes["/documentation"]["options"]["x-amazon-apigateway-integration"],
      uri: "${LB_URL}/openapi-nest-example/documentation/static/{assetPath}"}
  }

  const asyncAssetOptions = {...pathsWithNoPrefixes["/async_documentation"]["options"],
    "x-amazon-apigateway-integration": {...pathsWithNoPrefixes["/async_documentation"]["options"]["x-amazon-apigateway-integration"],
      uri: "${LB_URL}/openapi-nest-example/async_documentation/{asyncAssetPath}"}
  }


  const assetDocumentation = {get: {tags:["appInfo"], operationId: "assets", "parameters": [
        {
          "name": "assetPath",
          "in": "path",
          "required": true,
          schema: {type: "string"}
        }
      ], responses: {
        "200": {
          description: "Endpoint used to serve open api documentation",
        },
      }, "x-amazon-apigateway-integration": gatewayIntegration}, options: assetOptions}

  const asyncAssetDocumentation = {get: {tags:["appInfo"], operationId: "asyncAssets", "parameters": [
        {
          "name": "asyncAssetPath",
          "in": "path",
          "required": true,
          schema: {type: "string"}
        }
      ], responses: {
        "200": {
          description: "Endpoint used to serve async api documentation",
        },
      }, "x-amazon-apigateway-integration": asyncGatewayIntegration}, options: asyncAssetOptions}

  const assetsPathsWithNoPrefixes = {"/documentation/static/{assetPath+}": assetDocumentation, "/async_documentation/{asyncAssetPath+}": asyncAssetDocumentation}

  return assetsPathsWithNoPrefixes
}

