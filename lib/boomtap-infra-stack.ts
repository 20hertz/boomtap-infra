import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3Deployment from "@aws-cdk/aws-s3-deployment";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as path from "path";
import { CfnOutput, Environment } from "@aws-cdk/core";
import {
  CloudFrontWebDistributionProps,
  OriginAccessIdentity,
} from "@aws-cdk/aws-cloudfront";
import { PolicyStatement } from "@aws-cdk/aws-iam";
import { ARecord, HostedZone, RecordTarget } from "@aws-cdk/aws-route53";
import { CloudFrontTarget } from "@aws-cdk/aws-route53-targets";
interface StackProps {
  certificateArn: string;
  domainName: string;
  envName: string;
  env: Environment;
}

export class FrontEndStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const assetBucket = new s3.Bucket(
      this,
      `bt-static-website-${props.envName}`,
      {
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        websiteIndexDocument: "index.html",
        websiteErrorDocument: "index.html",
      }
    );

    const cloudFrontOAI = new OriginAccessIdentity(this, "OAI", {
      comment: `OAI for Boomtap static website`,
    });

    const distributionProps: CloudFrontWebDistributionProps = {
      viewerCertificate: {
        aliases: [props.domainName],
        props: {
          acmCertificateArn: props.certificateArn,
          sslSupportMethod: "sni-only",
        },
      },
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: assetBucket,
            originAccessIdentity: cloudFrontOAI,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    };

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "SiteDistribution",
      distributionProps
    );

    new CfnOutput(this, "DistributionDomainName", {
      description: "The CloudFront domain of the website",
      value: distribution.distributionDomainName,
    });

    new s3Deployment.BucketDeployment(this, "DeployWebsite", {
      sources: [
        s3Deployment.Source.asset(
          path.join(__dirname, "..", "..", "boomtap", "dist")
        ),
      ],
      destinationBucket: assetBucket,
      distribution: distribution,
    });

    const cloudfrontS3Access = new PolicyStatement();
    cloudfrontS3Access.addActions("s3:GetBucket*");
    cloudfrontS3Access.addActions("s3:GetObject*");
    cloudfrontS3Access.addActions("s3:List*");
    cloudfrontS3Access.addResources(assetBucket.bucketArn);
    cloudfrontS3Access.addResources(`${assetBucket.bucketArn}/*`);
    cloudfrontS3Access.addCanonicalUserPrincipal(
      cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
    );

    assetBucket.addToResourcePolicy(cloudfrontS3Access);

    const zone = HostedZone.fromLookup(this, props.domainName, {
      domainName: props.domainName,
      privateZone: false,
    });

    new ARecord(this, "Alias", {
      zone,
      recordName: props.domainName,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });
  }
}
