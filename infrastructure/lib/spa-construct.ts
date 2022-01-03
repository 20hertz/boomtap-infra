import { RemovalPolicy, Stack } from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import * as path from "path";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as iam from "aws-cdk-lib/aws-iam";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import { Code, Runtime } from "aws-cdk-lib/aws-lambda";

interface SpaConstructProps {
  subdomain?: string;
}

export class SpaConstruct extends Construct {
  constructor(scope: Stack, name: string, props: SpaConstructProps) {
    super(scope, name);

    const siteDomain = props.subdomain
      ? props.subdomain + ".boomtap.io"
      : "boomtap.io";

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: siteDomain,
    });

    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(
      this,
      "OriginAccessIdentity",
      { comment: `OAI for ${name}` }
    );

    const sourceBucket = new s3.Bucket(this, "SiteBucket", {
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html",
    });

    sourceBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [sourceBucket.arnForObjects("*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    // TLS certificate
    const certificate = new acm.DnsValidatedCertificate(
      this,
      "SiteCertificate",
      {
        domainName: siteDomain,
        hostedZone,
        region: "us-east-1", // Cloudfront only checks this region for certificates.
      }
    );

    // certificate
    //   .metricDaysToExpiry()
    //   .createAlarm(this, "CertificateExpiryAlarm", {
    //     comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
    //     evaluationPeriods: 1,
    //     threshold: 45, // Automatic rotation happens between 60 and 45 days before expiry
    //   });

    // new CfnOutput(this, "Certificate", { value: certificateArn });

    // Specifies you want viewers to use HTTPS & TLS v1.1 to request your objects
    const viewerCertificate = cloudfront.ViewerCertificate.fromAcmCertificate(
      certificate,
      // {
      //   certificateArn: certificateArn,
      //   env: {
      //     region: Aws.REGION,
      //     account: Aws.ACCOUNT_ID,
      //   },
      //   node: this.node,
      //   stack: parent,
      //   metricDaysToExpiry: () =>
      //     new cloudwatch.Metric({
      //       namespace: "TLS Viewer Certificate Validity",
      //       metricName: "TLS Viewer Certificate Expired",
      //     }),
      // },
      {
        aliases: [siteDomain],
      }
    );

    const edgeAuth = new cloudfront.experimental.EdgeFunction(
      this,
      "EdgeAuthFn",
      {
        handler: "index.handler",
        runtime: Runtime.NODEJS_14_X,
        code: Code.fromAsset(`${__dirname}/../lambdas`),
        memorySize: 128,
      }
    );

    const distribution = new cloudfront.CloudFrontWebDistribution(
      this,
      "CloudFrontDistribution",
      {
        viewerCertificate,
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: sourceBucket,
              originAccessIdentity: cloudfrontOAI,
            },
            behaviors: [
              // { isDefaultBehavior: true },
              {
                lambdaFunctionAssociations: [
                  {
                    lambdaFunction: edgeAuth.currentVersion,
                    eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
                  },
                ],
                isDefaultBehavior: true,
                // allowedMethods: cloudfront.CloudFrontAllowedMethods.ALL,
              },
            ],
          },
        ],
      }
    );

    new route53.ARecord(this, "SiteAliasRecord", {
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
      zone: hostedZone,
    });

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
