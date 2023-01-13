import { App, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import * as path from "path";
import {
  Behavior,
  CloudFrontAllowedMethods,
  CloudFrontWebDistribution,
  experimental,
  LambdaEdgeEventType,
  OriginAccessIdentity,
  ViewerCertificate,
} from "aws-cdk-lib/aws-cloudfront";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Metric } from "aws-cdk-lib/aws-cloudwatch";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { SSMParameterReader } from "./ssm-param-reader";
import { HttpsRedirect } from "aws-cdk-lib/aws-route53-patterns";
import { StackContext } from "../types";

export class SpaStack extends Stack {
  constructor(
    parent: App,
    name: string,
    props: StackProps,
    context: StackContext
  ) {
    super(parent, name, props);

    const hostedZoneIdReader = new SSMParameterReader(
      this,
      "HostedZoneIdReader",
      {
        parameterName: "Hosted_Zone_ID",
        region: context.region,
      }
    );

    const certificateArnReader = new SSMParameterReader(
      this,
      "CertificateArnReader",
      {
        parameterName: "Certificate_ARN",
        region: context.region,
      }
    );

    const { distribution, sourceBucket } = new SpaConstruct(
      this,
      "SpaConstruct",
      {
        hostedZoneId: hostedZoneIdReader.getParameterValue(),
        certificateArn: certificateArnReader.getParameterValue(),
        ...props,
      },
      context
    );

    new StringParameter(this, "WebsiteBucketSsmParam", {
      parameterName: `${name}_Bucket`,
      description: "Name of the S3 bucket containing the website assets",
      stringValue: sourceBucket.bucketName,
    });

    new StringParameter(this, "DistributionSsmParam", {
      parameterName: `${name}_Distribution_ID`,
      description: "CloudFront distribution ID",
      stringValue: distribution.distributionId,
    });
  }
}

export interface SpaConstructProps extends StackProps {
  certificateArn: string;
  hostedZoneId: string;
}

class SpaConstruct extends Construct {
  public readonly sourceBucket: s3.Bucket;
  public readonly distribution: CloudFrontWebDistribution;

  constructor(
    scope: Stack,
    name: string,
    props: SpaConstructProps,
    context: StackContext
  ) {
    super(scope, name);

    const zoneName = [context.subdomain, context.domainApex]
      .filter(Boolean)
      .join(".");

    const siteDomain = [
      context.stack.subdomain,
      context.subdomain,
      context.domainApex,
    ]
      .filter(Boolean)
      .join(".");

    const cloudfrontOAI = new OriginAccessIdentity(
      this,
      "OriginAccessIdentity",
      { comment: `OAI for ${name}` }
    );

    this.sourceBucket = new s3.Bucket(this, "SiteBucket", {
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html",
    });

    this.sourceBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [this.sourceBucket.arnForObjects("*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    const viewerCertificate = ViewerCertificate.fromAcmCertificate(
      {
        certificateArn: props.certificateArn,
        env: {
          region: "us-east-1",
          account: context.accountNumber,
        },
        node: this.node,
        stack: scope,
        metricDaysToExpiry: () =>
          new Metric({
            namespace: "TLS Viewer Certificate Validity",
            metricName: "TLS Viewer Certificate Expired",
          }),
        applyRemovalPolicy(): void {},
      },
      {
        aliases: [siteDomain],
      }
    );

    const edgeAuth = new experimental.EdgeFunction(this, "EdgeAuthFn", {
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset(path.join(__dirname, "..", "lambdas")),
      memorySize: 128,
    });

    const behavior: Behavior = context.httpAuth
      ? {
          lambdaFunctionAssociations: [
            {
              lambdaFunction: edgeAuth,
              eventType: LambdaEdgeEventType.VIEWER_REQUEST,
            },
          ],
          isDefaultBehavior: true,
          allowedMethods: CloudFrontAllowedMethods.GET_HEAD_OPTIONS,
        }
      : { isDefaultBehavior: true };

    this.distribution = new CloudFrontWebDistribution(
      this,
      "CloudFrontDistribution",
      {
        viewerCertificate,
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: this.sourceBucket,
              originAccessIdentity: cloudfrontOAI,
            },
            behaviors: [behavior],
          },
        ],
      }
    );

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        zoneName,
        hostedZoneId: props.hostedZoneId,
      }
    );

    new route53.ARecord(this, "SiteAliasRecord", {
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(this.distribution)
      ),
      zone: hostedZone,
    });

    new s3deploy.BucketDeployment(this, "CdkDeploymentBucket", {
      sources: [
        s3deploy.Source.asset(path.join(__dirname, "..", "placeholder")),
      ],
      destinationBucket: this.sourceBucket,
      distribution: this.distribution,
      distributionPaths: ["/*"],
    });

    if (!context.subdomain && !context.stack.subdomain) {
      new HttpsRedirect(this, "Redirect", {
        zone: hostedZone,
        recordNames: [`www.${context.domainApex}`],
        targetDomain: context.domainApex,
      });
    }
  }
}
