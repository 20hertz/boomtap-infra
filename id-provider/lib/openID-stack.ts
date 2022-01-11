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

interface OIDCProviderStackProps extends StackProps {
  gitHubBranchName: string;
}

export class OIDCProviderStack extends Stack {
  constructor(scope: Construct, id: string, props: OIDCProviderStackProps) {
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
    /**
     * Create a deployment role that has short lived credentials. The only
     * principal that can assume this role is the GitHub Open ID provider.
     *
     * This role is granted authority to assume aws cdk roles; which are created
     * by the aws cdk v2.
     */
    const cdkDeployerRole = new Role(this, "CDKDeployerRole", {
      assumedBy: new WebIdentityPrincipal(
        gitHubOIDCProvider.openIdConnectProviderArn,
        {
          StringLike: {
            "token.actions.githubusercontent.com:sub": `repo:${githubUsername}/boomtap-infra:ref:refs/heads/${props.gitHubBranchName}`,
          },
        }
      ),
      inlinePolicies: {
        CdkDeploymentPolicy: new PolicyDocument({
          assignSids: true,
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: [
                "sts:AssumeRole",
                // in trial without
                // "route53:GetHostedZone"
              ],
              resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
            }),
          ],
        }),
      },
    });

    new CfnOutput(this, "CDKDeployerRoleArn", {
      value: cdkDeployerRole.roleArn,
      description:
        "Copy-paste this ARN next to role-to-assume in the deployment workflow",
    });

    const websiteDeployerRole = new Role(this, "WebsiteDeployerRole", {
      assumedBy: new WebIdentityPrincipal(
        gitHubOIDCProvider.openIdConnectProviderArn,
        {
          StringLike: {
            // "token.actions.githubusercontent.com:sub": `repo:${githubUsername}/boomtap:ref:refs/heads/develop`,
            "token.actions.githubusercontent.com:sub": `repo:${githubUsername}/boomtap*`,
          },
        }
      ),
      inlinePolicies: {
        AppDeploymentPolicy: new PolicyDocument({
          assignSids: true,
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["cloudfront:CreateInvalidation"],
              resources: [`arn:aws:cloudfront::${this.account}:distribution/*`],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              actions: ["s3:*"],
              resources: ["*"],
            }),
          ],
        }),
      },
    });

    new CfnOutput(this, "WebsiteDeployerRoleArn", {
      value: websiteDeployerRole.roleArn,
      description:
        "Copy-paste this ARN next to role-to-assume in the deployment workflow",
    });
  }
}
