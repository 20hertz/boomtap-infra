import { Stack, StackProps } from "aws-cdk-lib";
import {
  CertificateValidation,
  DnsValidatedCertificate,
} from "aws-cdk-lib/aws-certificatemanager";
import { PublicHostedZone } from "aws-cdk-lib/aws-route53";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Construct } from "constructs";

interface CertifiedDomainProps extends StackProps {
  domainName: string;
  subdomain?: string;
}

export class CertifiedDomainStack extends Stack {
  constructor(scope: Construct, id: string, props: CertifiedDomainProps) {
    super(scope, id, props);

    const hostedZone = new PublicHostedZone(this, "HostedZone", {
      zoneName: props.domainName,
    });

    new StringParameter(this, "HostedZoneIdSsmParam", {
      parameterName: "Hosted_Zone_ID",
      description: "The Route 53 hosted zone id for this account",
      stringValue: hostedZone.hostedZoneId,
    });

    // const isSecondLevelDomain = props.domainName === "boomtap.io";

    // if (!isSecondLevelDomain && hostedZone.hostedZoneNameServers) {
    //   const domainSplit = props.domainName.split(".");
    //   domainSplit.shift();
    //   const sldZone = HostedZone.fromLookup(this, "SLD Zone", {
    //     domainName: domainSplit.join("."),
    //   });

    //   new NsRecord(this, "NameServerRecord", {
    //     recordName: props.domainName,
    //     values: hostedZone.hostedZoneNameServers,
    //     zone: sldZone,
    //   });
    // }

    const certificate = new DnsValidatedCertificate(this, "TLSCertificate", {
      hostedZone,
      domainName: props.domainName,
      subjectAlternativeNames:
        [`${props.subdomain}.${props.domainName}`] ?? undefined,
      validation: CertificateValidation.fromDns(hostedZone),
    });

    new StringParameter(this, "CertificateArnSsmParam", {
      parameterName: "Certificate_ARN",
      description: `The TLS certificate ARN for the domains in the hosted zone ${hostedZone.hostedZoneId}`,
      stringValue: certificate.certificateArn,
    });
  }
}
