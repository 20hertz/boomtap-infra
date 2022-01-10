#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { CertifiedDomainStack } from "../lib/certificate-stack";
import { SpaStack } from "../lib/spa-stack";

interface Config {
  readonly domainName: string;
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
    domainName: app.node.tryGetContext(env)["DomainName"],
    httpAuth: app.node.tryGetContext(env)["HTTPAuth"],
    subdomain: app.node.tryGetContext(env)[stackName]["Subdomain"],
  };
};

new CertifiedDomainStack(app, "CertifiedDomainStack", {
  env: {
    region: "us-east-1",
  },
  domainName: mapConfig("CertifiedDomainStack").domainName,
  subdomain: mapConfig("CertifiedDomainStack").subdomain,
});

new SpaStack(app, "LandingPageStack", {
  env: {
    region: "ca-central-1",
  },
  ...mapConfig("LandingPageStack"),
});

new SpaStack(app, "WebAppStack", {
  env: {
    region: "ca-central-1",
  },
  ...mapConfig("WebAppStack"),
});
