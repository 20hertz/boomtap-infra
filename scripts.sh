#!/bin/zsh

# Create CDKExecutionAccess policy
create_cdk_policy() {
    ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text --profile $1)
    aws iam create-policy --policy-name CDKExecutionAccess --policy-document file://cdkExecutionPolicy.json --profile $1
}


# Update CDKExecutionAccess policy
update_cdk_policy() {
    ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text --profile $1)
    aws iam create-policy-version --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/CDKExecutionAccess --policy-document file://cdkExecutionPolicy.json --set-as-default --profile $1
}

# Create AWS secret access key
create_access_key() {
    aws iam create-access-key --user-name "Webapp" --profile $1
}

# Check the command-line argument to determine which script to run
if [ "$1" = "create_cdk_policy" ]; then
    shift  # Remove the first argument which is the script name
    create_cdk_policy "$1"
elif [ "$1" = "update_cdk_policy" ]; then
    shift
    update_cdk_policy "$1"
elif [ "$1" = "create_access_key" ]; then
    shift
    create_access_key "$1"
else
    echo "Usage: $0 {create_cdk_policy|update_cdk_policy|create_access_key}"
    exit 1
fi