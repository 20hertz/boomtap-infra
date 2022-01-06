#!/usr/bin/env node
import { App, DefaultStackSynthesizer, Stack, StackProps } from "aws-cdk-lib";
import { SpaConstruct } from "../lib/spa-construct";

interface Config {
  readonly accountID: string;
  readonly hostedZoneId: string;
  readonly httpAuth?: boolean;
  readonly subdomain?: string;
}

export class SpaStack extends Stack {
  constructor(
    parent: App,
    name: string,
    props: StackProps,
    config: Omit<Config, "accountID">
  ) {
    super(parent, name, props);

    new SpaConstruct(this, "SpaStack", config);
  }
}

const app = new App();

const mapConfig = (stackName: string): Config => {
  const env = app.node.tryGetContext("config");

  if (!env)
    throw new Error(
      "Context variable missing on CDK command. Pass in as `-c config=XXX`"
    );

  return {
    accountID: app.node.tryGetContext(env)["AccountID"],
    hostedZoneId: app.node.tryGetContext(env)[stackName]["HostedZoneId"],
    httpAuth: app.node.tryGetContext(env)["HTTPAuth"],
    subdomain: app.node.tryGetContext(env)[stackName]["Subdomain"],
  };
};

// const landingPageConfig = mapConfig("LandingPage");

// new SpaStack(
//   app,
//   "LandingPageStack",
//   {
//     env: {
//       region: "ca-central-1",
//       account: landingPageConfig.accountID,
//     },
//   },
//   {
//     hostedZoneId: landingPageConfig.hostedZoneId,
//     httpAuth: landingPageConfig.httpAuth,
//     subdomain: landingPageConfig.subdomain,
//   }
// );

// const webAppConfig = mapConfig("WebApp");

// new SpaStack(
//   app,
//   "WebAppStack",
//   {
//     env: {
//       region: "ca-central-1",
//       account: webAppConfig.accountID,
//     },
//   },
//   {
//     hostedZoneId: webAppConfig.hostedZoneId,
//     httpAuth: webAppConfig.httpAuth,
//     subdomain: webAppConfig.subdomain,
//   }
// );

const makeStack = (stackName: string) => {
  const { accountID, ...config } = mapConfig(stackName);
  new SpaStack(
    app,
    stackName,
    {
      env: {
        region: "ca-central-1",
        account: accountID,
      },
    },
    config
  );
};

makeStack("LandingPageStack");
makeStack("WebAppStack");
