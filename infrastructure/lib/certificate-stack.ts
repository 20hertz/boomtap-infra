import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import {
  CertificateValidation,
  DnsValidatedCertificate,
} from "aws-cdk-lib/aws-certificatemanager";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

interface CertifiedDomainProps extends StackProps {
  domainName: string;
  subdomain?: string;
}

export class CertifiedDomainStack extends Stack {
  constructor(scope: Construct, id: string, props: CertifiedDomainProps) {
    super(scope, id, props);

    const hostedZone = new HostedZone(this, "HostedZone", {
      zoneName: props.domainName,
    });

    new CfnOutput(this, "HostedZoneID", {
      value: hostedZone.hostedZoneId,
      description: "This value is required in SPA stack configuration",
    });

    const certificate = new DnsValidatedCertificate(this, "TLSCertificate", {
      hostedZone,
      domainName: props.domainName,
      subjectAlternativeNames:
        [`${props.subdomain}.${props.domainName}`] ?? undefined,
      validation: CertificateValidation.fromDns(hostedZone),
    });

    new CfnOutput(this, "Certificate ARN", {
      value: certificate.certificateArn,
      description: "This value is required in SPA stack configuration",
    });
  }
}
