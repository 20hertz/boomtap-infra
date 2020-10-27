import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3Deployment from "@aws-cdk/aws-s3-deployment";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as path from "path";
import { CfnOutput } from "@aws-cdk/core";

const domainName = "boomtap.io";

interface FrontEndProps {
  certificateArn: string;
}

export class FrontEndStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: FrontEndProps) {
    super(scope, id);

    const assetBucket = new s3.Bucket(this, "stephane-static-website", {
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html",
    });

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "SiteDistribution",
      {
        viewerCertificate: {
          aliases: [domainName],
          props: {
            acmCertificateArn: props?.certificateArn,
            sslSupportMethod: "sni-only",
          },
        },
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: assetBucket,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      }
    );

    new CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
    });

    new s3Deployment.BucketDeployment(this, "DeployWebsite", {
      sources: [
        s3Deployment.Source.asset(
          path.join(__dirname, "..", "..", "midi-proto", "dist")
        ),
      ],
      destinationBucket: assetBucket,
      distribution: distribution,
    });
  }
}
