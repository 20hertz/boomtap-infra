import * as cdk from "aws-cdk-lib";
const supportedEnvironments = ["staging"] as const;

type SupportedEnvironments = (typeof supportedEnvironments)[number];

type Config = {
  environment: SupportedEnvironments;
  origins: string[];
};

export const getContext = (app: cdk.App): Config => {
  const env = app.node.tryGetContext("env");
  if (!env) {
    throw new Error(
      "Environment variable must be passed to cdk: `cdk -c env=<dev | prod>`"
    );
  }
  if (!supportedEnvironments.includes(env)) {
    throw new Error(
      `${env} is not in supported environments: ${supportedEnvironments.join(
        ", "
      )}`
    );
  }
  // this contains the values in the context without being
  // validated
  const unparsedEnv = app.node.tryGetContext(env);

  return {
    environment: env,
    origins: unparsedEnv["origins"],
    // region: ensureString(unparsedEnv, "region"),
  };
};

function ensureString(object: Record<string, any>, key: keyof Config): string {
  if (
    !object[key] ||
    typeof object[key] !== "string" ||
    object[key].trim().length === 0
  ) {
    throw new Error(key + " does not exist in cdk config");
  }
  return object[key];
}
