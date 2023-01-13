import { Stack, StackProps } from "aws-cdk-lib";
import {
  CertificateValidation,
  DnsValidatedCertificate,
} from "aws-cdk-lib/aws-certificatemanager";
import { PublicHostedZone } from "aws-cdk-lib/aws-route53";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";
import { StackContext } from "../types";

export class CertifiedDomainStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps,
    context: StackContext
  ) {
    super(scope, id, props);

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

    const hostedZone = new PublicHostedZone(this, "HostedZone", {
      zoneName,
    });

    new StringParameter(this, "HostedZoneIdSsmParam", {
      parameterName: "Hosted_Zone_ID",
      description: "The Route 53 hosted zone id for this account",
      stringValue: hostedZone.hostedZoneId,
    });

    const certificate = new DnsValidatedCertificate(this, "TLSCertificate", {
      hostedZone,
      domainName: zoneName,
      subjectAlternativeNames:
        context.subdomain || context.stack.subdomain ? [siteDomain] : undefined,
      validation: CertificateValidation.fromDns(hostedZone),
      // To use a certificate in AWS Certificate Manager to require HTTPS between viewers and CloudFront,
      // make sure you request (or import) the certificate in the US East region.
      // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html#https-requirements-aws-region
      region: "us-east-1",
    });

    new StringParameter(this, "CertificateArnSsmParam", {
      parameterName: "Certificate_ARN",
      description: `The TLS certificate ARN for the domains in the hosted zone ${hostedZone.hostedZoneId}`,
      stringValue: certificate.certificateArn,
    });
  }
}
