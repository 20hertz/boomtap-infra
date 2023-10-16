import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

const githubDomain = "token.actions.githubusercontent.com";

export interface GitHubStackProps extends cdk.StackProps {
  /**
   * Name of the deploy role to assume in GitHub Actions.
   */
  readonly deployRole: string;
  /**
   * The sub prefix string from the JWT token used to be validated by AWS. Appended after `repo:${owner}/${repo}:`
   * in an IAM role trust relationship. The default value '*' indicates all branches and all tags from this repo.
   *
   * @example
   * - repo:octo-org/octo-repo:ref:refs/heads/demo-branch - only allowed from `demo-branch`
   * - repo:octo-org/octo-repo:ref:refs/tags/demo-tag - only allowed from `demo-tag`.
   * - repo:octo-org/octo-repo:pull_request - only allowed from the `pull_request` event.
   * - repo:octo-org/octo-repo:environment:Production - only allowd from `Production` environment name.
   *
   * @see https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#configuring-the-oidc-trust-with-the-cloud
   */
  readonly repositoryConfig: { owner: string; repo: string; filter?: string }[];
}

export class GitHubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: GitHubStackProps) {
    super(scope, id, props);

    /**
     * Create an OpenID Connect (OIDC) provider for GitHub inside the AWS Account. This
     * allows GitHub Actions to assume a role which can be used to deploy the CDK application.
     *
     * For the thumbprint
     * @see https://github.blog/changelog/2022-01-13-github-actions-update-on-oidc-based-deployments-to-aws/
     */
    const githubProvider = new iam.CfnOIDCProvider(this, "GitHubOIDCProvider", {
      clientIdList: ["sts.amazonaws.com"],
      url: `https://${githubDomain}`,
      thumbprintList: ["6938fd4d98bab03faadb97b34396831e3780aea1"],
    });

    const iamRepoDeployAccess = props.repositoryConfig.map(
      (r) => `repo:${r.owner}/${r.repo}:${r.filter ?? "*"}`
    );

    /**
     * Defines a role with short-lived credentials and can only be assumed by GitHub Actions.
     */
    const githubActionsRole = new iam.Role(this, "GitHubActionsRole", {
      assumedBy: new iam.FederatedPrincipal(
        githubProvider.attrArn,
        {
          StringLike: {
            [`${githubDomain}:sub`]: iamRepoDeployAccess,
          },
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
        },
        "sts:AssumeRoleWithWebIdentity"
      ),
      description:
        "This role is used by the GitHub Actions workflow to deploy stacks to this account.",
      roleName: props.deployRole,
    });

    const assumeCdkDeploymentRoles = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["sts:AssumeRole"],
      resources: [`arn:aws:iam::${this.account}:role/cdk-*`],
      conditions: {
        StringEquals: {
          "aws:ResourceTag/aws-cdk:bootstrap-role": [
            "deploy",
            "file-publishing",
            "lookup",
          ],
        },
      },
    });

    githubActionsRole.addToPolicy(assumeCdkDeploymentRoles);
  }
}
