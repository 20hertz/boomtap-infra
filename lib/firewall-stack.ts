import * as cdk from "@aws-cdk/core";
import * as wafv2 from "@aws-cdk/aws-wafv2";

export class FirewallStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id?: string,
    props?: cdk.StackProps,
    ipWhiteList?: string[]
  ) {
    super(scope, id, props);

    const ipSet = new wafv2.CfnIPSet(this, "IPSet", {
      addresses: ipWhiteList ? ipWhiteList.map((o: any) => o.address) : [],
      ipAddressVersion: "IPV4",
      scope: "CLOUDFRONT",
    });

    const rules: wafv2.CfnRuleGroup.RuleProperty[] = [
      {
        action: { allow: {} },
        name: "Permitted-IPs",
        priority: 1,
        statement: {
          ipSetReferenceStatement: {
            arn: ipSet.attrArn,
          },
        },
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: "allow-permitted-ips",
          sampledRequestsEnabled: true,
        },
      },
    ];

    const wafAclCloudFront = new wafv2.CfnWebACL(this, "WafCloudFront", {
      name: "Waf-CloudFront",
      defaultAction: { block: {} },
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "waf-cloudfront",
        sampledRequestsEnabled: true,
      },
      rules: rules,
    });

    this.exportValue(wafAclCloudFront.attrArn);
  }
}
