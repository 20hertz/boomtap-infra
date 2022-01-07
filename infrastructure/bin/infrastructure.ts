#!/usr/bin/env node
import { App, Stack, StackProps } from "aws-cdk-lib";
import { CertifiedDomainStack } from "../lib/certificate-stack";
import { SpaConstruct } from "../lib/spa-construct";

interface Config {
  readonly accountID: string;
  readonly certificateArn: string;
  readonly domainName: string;
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

    new SpaConstruct(this, "SpaConstruct", config);
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
    certificateArn: app.node.tryGetContext(env)["CertificateARN"],
    domainName: app.node.tryGetContext(env)["DomainName"],
    hostedZoneId: app.node.tryGetContext(env)["HostedZoneId"],
    httpAuth: app.node.tryGetContext(env)["HTTPAuth"],
    subdomain: app.node.tryGetContext(env)[stackName]["Subdomain"],
  };
};

const makeStack = (stackName: string) => {
  const { accountID, ...config } = mapConfig(stackName);
  new SpaStack(
    app,
    stackName,
    {
      stackName,
      env: {
        region: "ca-central-1",
        // account: accountID,
      },
    },
    config
  );
};

new CertifiedDomainStack(app, "CertifiedDomainStack", {
  env: {
    region: "us-east-1",
  },
  domainName: mapConfig("CertifiedDomainStack").domainName,
  subdomain: mapConfig("CertifiedDomainStack").subdomain,
});

makeStack("LandingPageStack");
makeStack("WebAppStack");
