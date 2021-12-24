import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  OpenIdConnectProvider,
  Role,
  PolicyDocument,
  PolicyStatement,
  Effect,
  WebIdentityPrincipal,
} from "aws-cdk-lib/aws-iam";

export class BootstrapStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * Create an Identity provider for GitHub inside your AWS Account. This
     * allows GitHub to present itself to AWS IAM and assume a role.
     */
    const gitHubOIDCProvider = new OpenIdConnectProvider(
      this,
      "GitHubOIDCProvider",
      {
        url: "https://token.actions.githubusercontent.com",
        clientIds: ["sts.amazonaws.com"],
      }
    );

    const githubUsername = "20hertz";
    const githubRepoName = "boomtap-infra";
    const githubBranchName = "unbind-from-cdk-spa-deploy";

    /**
     * Create a deployment role that has short lived credentials. The only
     * principal that can assume this role is the GitHub Open ID provider.
     *
     * This role is granted authority to assume aws cdk roles; which are created
     * by the aws cdk v2.
     */
    const applicationDeployerRole = new Role(this, "applicationDeployerRole", {
      assumedBy: new WebIdentityPrincipal(
        gitHubOIDCProvider.openIdConnectProviderArn,
        {
          StringLike: {
            "token.actions.githubusercontent.com:sub": `repo:${githubUsername}/${githubRepoName}:ref:refs/heads/${githubBranchName}`,
          },
        }
      ),
      inlinePolicies: {
        CdkDeploymentPolicy: new PolicyDocument({
          assignSids: true,
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["sts:AssumeRole", "route53:GetHostedZone"],
              resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
            }),
          ],
        }),
      },
    });

    new CfnOutput(this, "applicationDeployerRoleArn", {
      value: applicationDeployerRole.roleArn,
      description:
        "Copy-paste this ARN next to role-to-assume in the deployment workflow",
    });
  }
}
