#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { CertifiedDomainStack } from "../lib/certificate-stack";
import { SpaStack } from "../lib/spa-stack";

interface Config {
  readonly domain: string;
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

  const environmentDomain = app.node.tryGetContext(env)["EnvironmentDomain"];
  const subdomain = app.node.tryGetContext(env)[stackName]["Subdomain"];

  return {
    domain: environmentDomain,
    httpAuth: app.node.tryGetContext(env)["HTTPAuth"],
    subdomain,
  };
};

new CertifiedDomainStack(app, "CertifiedDomainStack", {
  env: {
    region: "us-east-1",
  },
  domain: mapConfig("CertifiedDomainStack").domain,
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
