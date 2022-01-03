#!/usr/bin/env node
import { App, DefaultStackSynthesizer, Stack, StackProps } from "aws-cdk-lib";
import { SpaConstruct } from "../lib/spa-construct";

interface Config {
  readonly accountID: string;
  readonly httpAuth?: boolean;
  readonly subdomain?: string;
}

export class SpaStack extends Stack {
  constructor(
    parent: App,
    name: string,
    props: StackProps,
    config?: Omit<Config, "accountID">
  ) {
    super(parent, name, props);

    new SpaConstruct(this, "SpaStack", config);
  }
}

const app = new App();

const getConfig = (): Config => {
  const env = app.node.tryGetContext("config");

  if (!env)
    throw new Error(
      "Context variable missing on CDK command. Pass in as `-c config=XXX`"
    );

  return {
    accountID: app.node.tryGetContext(env)["AccountID"],
    httpAuth: app.node.tryGetContext(env)["HTTPAuth"],
    subdomain: app.node.tryGetContext(env)["Subdomain"],
  };
};

const config = getConfig();

new SpaStack(
  app,
  "LandingPageStack",
  {
    env: {
      region: "ca-central-1",
      account: config.accountID,
    },
    synthesizer: new DefaultStackSynthesizer({
      // Specified at the bootstrap time. Checkout package.json "bootstrap" script.
      qualifier: "feedform",
    }),
  },
  {
    subdomain: `${config.subdomain}.feed`,
    httpAuth: config.httpAuth,
  }
);
