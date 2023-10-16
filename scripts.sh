#!/bin/zsh

ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text --profile backstage)

# Script 1: Update CDKExecutionAccess policy
update_cdk_policy() {
    aws iam create-policy-version --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/CDKExecutionAccess --policy-document file://cdkExecutionPolicy.json --set-as-default --profile backstage
}

# Script 2: Create AWS secret access ley
create_access_key() {
    aws iam create-access-key --user-name "Webapp" --profile backstage
}

# Check the command-line argument to determine which script to run
if [ "$1" == "update_cdk_policy" ]; then
    update_cdk_policy
elif [ "$1" == "create_access_key" ]; then
    create_access_key
else
    echo "Usage: $0 {update_cdk_policy|create_access_key}"
    exit 1
fi