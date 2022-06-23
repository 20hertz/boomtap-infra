#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { CertifiedDomainStack } from "../lib/certificate-stack";
import { SpaStack } from "../lib/spa-stack";

interface Config {
  readonly domainApex: string;
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

  const environmentSubdomain =
    app.node.tryGetContext(env)["EnvironmentSubdomain"];
  const subdomain = app.node.tryGetContext(env)[stackName]["Subdomain"];

  return {
    domainApex: "boomtap.io",
    httpAuth: app.node.tryGetContext(env)["HTTPAuth"],
    subdomain: `${subdomain}.${environmentSubdomain}` ?? subdomain,
  };
};

new CertifiedDomainStack(app, "CertifiedDomainStack", {
  env: {
    region: "us-east-1",
  },
  domainApex: mapConfig("CertifiedDomainStack").domainApex,
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
