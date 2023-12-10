import {
  RequestWithUser,
  AdfsSchema,
  CognitoSchema,
  buildUserInfo,
  prepareToken,
  DefaultAuthHandlers,
} from "../entity/security";

export const defaultAuthHandlers: DefaultAuthHandlers = {
  cognito: cognitoAuthHandler,
  adfs: adfsAuthHandler,
};

function cognitoAuthHandler(request: RequestWithUser): boolean {
  const prepared = prepareToken(request);
  if (!prepared) {
    return false;
  }
  const { token, relevantContent } = prepared;

  try {
    const fromJson = JSON.parse(relevantContent);
    const { identities } = CognitoSchema.parse(fromJson);
    if (!identities.length) {
      return false;
    }
    const userId = identities[0].userId;
    if (!userId.length) {
      return false;
    }
    request.user = buildUserInfo(token, userId, "cognito");
    return true;
  } catch (e) {
    return false;
  }
}

function adfsAuthHandler(request: RequestWithUser): boolean {
  const prepared = prepareToken(request);
  if (!prepared) {
    return false;
  }
  const { token, relevantContent } = prepared;

  try {
    const fromJson = JSON.parse(relevantContent);
    const { SAMAccountName } = AdfsSchema.parse(fromJson);
    if (!SAMAccountName.length) {
      return false;
    }
    request.user = buildUserInfo(token, SAMAccountName, "adfs");
    return true;
  } catch (e) {
    return false;
  }
}
