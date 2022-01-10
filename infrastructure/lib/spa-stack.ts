import { App, Aws, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
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
import { Function, IVersion } from "aws-cdk-lib/aws-lambda";
import { SSMParameterReader } from "./ssm-param-reader";

export interface SpaStackProps extends StackProps {
  domainName: string;
  httpAuth?: boolean;
  subdomain?: string;
}

export class SpaStack extends Stack {
  constructor(parent: App, name: string, props: SpaStackProps) {
    super(parent, name, props);

    const hostedZoneIdReader = new SSMParameterReader(
      this,
      "HostedZoneIdReader",
      {
        parameterName: "Hosted_Zone_ID",
        region: "us-east-1",
      }
    );

    const certificateArnReader = new SSMParameterReader(
      this,
      "CertificateArnReader",
      {
        parameterName: "Certificate_ARN",
        region: "us-east-1",
      }
    );

    new SpaConstruct(this, "SpaConstruct", {
      hostedZoneId: hostedZoneIdReader.getParameterValue(),
      certificateArn: certificateArnReader.getParameterValue(),
      ...props,
    });
  }
}

export interface SpaConstructProps extends SpaStackProps {
  certificateArn: string;
  hostedZoneId: string;
}

class SpaConstruct extends Construct {
  constructor(scope: Stack, name: string, props: SpaConstructProps) {
    super(scope, name);

    const siteDomain = props.subdomain
      ? props.subdomain + "." + props.domainName
      : props.domainName;

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "HostedZone",
      {
        zoneName: siteDomain,
        hostedZoneId: props.hostedZoneId,
      }
    );

    const cloudfrontOAI = new OriginAccessIdentity(
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

    const viewerCertificate = ViewerCertificate.fromAcmCertificate(
      {
        certificateArn: props.certificateArn,
        env: {
          region: "us-east-1",
          account: Aws.ACCOUNT_ID,
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
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset(path.join(__dirname, "..", "lambdas")),
      memorySize: 128,
    });

    const behavior: Behavior = props.httpAuth
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

    const distribution = new CloudFrontWebDistribution(
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
            behaviors: [behavior],
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
