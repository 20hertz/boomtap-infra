import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Bucket, BlockPublicAccess } from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import * as path from "path";
import { CloudFrontWebDistribution } from "aws-cdk-lib/aws-cloudfront";

export class LandingPageStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const sourceBucket = new Bucket(this, "SiteBucket", {
      autoDeleteObjects: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html",
    });

    const distribution = new CloudFrontWebDistribution(
      this,
      "CloudFrontDistribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: sourceBucket,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      }
    );

    new s3deploy.BucketDeployment(this, "CdkDeploymentBucket", {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, "..", "placeholder")),
      ],
      destinationBucket: sourceBucket,
      distribution,
      distributionPaths: ["/*"],
    });
  }
}
