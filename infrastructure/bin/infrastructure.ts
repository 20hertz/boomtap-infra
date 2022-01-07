#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { CertifiedDomainStack } from "../lib/certificate-stack";
import { SpaStack } from "../lib/spa-construct";

interface Config {
  readonly certificateArn: string;
  readonly domainName: string;
  readonly hostedZoneId: string;
  readonly httpAuth?: boolean;
  readonly subdomain?: string;
}

const app = new App();

const mapConfig = (stackName: string): Config => {
  const env = app.node.tryGetContext("config");

  if (!env)
    throw new Error(
      "Context variable missing on CDK command. Pass in as `-c config=XXX`"
    );

  return {
    certificateArn: app.node.tryGetContext(env)["CertificateARN"],
    domainName: app.node.tryGetContext(env)["DomainName"],
    hostedZoneId: app.node.tryGetContext(env)["HostedZoneId"],
    httpAuth: app.node.tryGetContext(env)["HTTPAuth"],
    subdomain: app.node.tryGetContext(env)[stackName]["Subdomain"],
  };
};

const makeStack = (stackName: string) =>
  new SpaStack(app, stackName, {
    stackName,
    env: {
      region: "ca-central-1",
    },
    ...mapConfig(stackName),
  });

new CertifiedDomainStack(app, "CertifiedDomainStack", {
  env: {
    region: "us-east-1",
  },
  domainName: mapConfig("CertifiedDomainStack").domainName,
  subdomain: mapConfig("CertifiedDomainStack").subdomain,
});

makeStack("LandingPageStack");
makeStack("WebAppStack");
