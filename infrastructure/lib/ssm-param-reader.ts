import { aws_iam } from "aws-cdk-lib";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  AwsSdkCall,
  PhysicalResourceId,
} from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

interface SSMParameterReaderProps {
  parameterName: string;
  region: string;
}

export class SSMParameterReader extends AwsCustomResource {
  constructor(scope: Construct, name: string, props: SSMParameterReaderProps) {
    const ssmAwsSdkCall: AwsSdkCall = {
      action: "getParameter",
      parameters: {
        Name: props.parameterName,
      },
      physicalResourceId: { id: Date.now().toString() },
      region: props.region,
      service: "SSM",
    };

    super(scope, name, {
      onUpdate: ssmAwsSdkCall,
      policy: {
        statements: [
          new PolicyStatement({
            actions: ["ssm:GetParameter"],
            effect: Effect.ALLOW,
            resources: ["*"],
          }),
        ],
      },
    });
  }

  public getParameterValue() {
    return this.getResponseField("Parameter.Value").toString();
  }
}
