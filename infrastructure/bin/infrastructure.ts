#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CertifiedDomainStack } from "../lib/certificate-stack";
import { SpaStack } from "../lib/spa-stack";
import * as gitBranch from "git-branch";
import { EnvironmentContext, Stack, StackContext } from "../types";

interface Config {
  readonly domain: string;
  readonly environmentSubdomain?: string;
  readonly httpAuth?: boolean;
  readonly subdomain?: string;
}

const app = new cdk.App();

export const getContext = async (app: cdk.App): Promise<EnvironmentContext> =>
  new Promise(async (resolve, reject) => {
    try {
      const currentBranch = await gitBranch();
      const environment = app.node
        .tryGetContext("environments")
        .find((e: any) => e.branchName === currentBranch);

      const globals = app.node.tryGetContext("globals");
      const stacks = app.node.tryGetContext("stacks") as Record<string, Stack>;
      const getStack = (name: string) => stacks[name];

      return resolve({
        ...globals,
        ...environment,
        getStack,
      });
    } catch (error) {
      return reject();
    }
  });

async function createStacks() {
  const context = await getContext(app);

  const stackProps = (stackName: string) => ({
    description: context.getStack(stackName).description,
    env: {
      region: context.region,
    },
    tags: {
      Environment: context.environment,
    },
  });

  const stackContext = (stackName: string): StackContext => {
    const { getStack, ...rest } = context;
    return {
      ...rest,
      stack: getStack(stackName),
    };
  };

  new CertifiedDomainStack(
    app,
    "CertifiedDomainStack",
    stackProps("CertifiedDomainStack"),
    stackContext("CertifiedDomainStack")
  );

  new SpaStack(
    app,
    "WebAppStack",
    stackProps("WebAppStack"),
    stackContext("WebAppStack")
  );
  new SpaStack(
    app,
    "LandingPageStack",
    stackProps("LandingPageStack"),
    stackContext("LandingPageStack")
  );
}

createStacks();
