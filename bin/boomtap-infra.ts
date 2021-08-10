// #!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { FrontEndStack } from "../lib/boomtap-infra-stack";
import { FirewallStack } from "../lib/firewall-stack";

const app = new cdk.App();



const getConfig = (): Config => {
  const env = app.node.tryGetContext("config");

  if (!env)
    throw new Error(
      "Context variable missing on CDK command. Pass in as `-c config=XXX`"
    );

  return {
    IPWhiteList: app.node.tryGetContext(env)["IPWhiteList"],
    Environment: app.node.tryGetContext(env)["Environment"],
    Subdomain: app.node.tryGetContext(env)["Subdomain"],
    WafWebAclArn: app.node.tryGetContext(env)["WafWebAclArn"],
  };
};

interface Config {
  readonly Environment: string
  readonly IPWhiteList?: string[]
  readonly Subdomain?: string
  readonly WafWebAclArn?: string
}

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const config = getConfig();


new FirewallStack(app, 'FirewallStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  }
})

const customProps = {
  ipWhiteList: config.IPWhiteList,
  subdomain: config.Subdomain,
  wafAclArn: config.WafWebAclArn
};

new FrontEndStack(app, `FrontEndStack${capitalize(config.Environment)}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
}, customProps)