# Bootstrap stack

Creates a custom OIDC provider to grant GitHub a temporary federated identity. This identity will be trusted, to assume a role in your AWS account. This approach keeps us from storing long lived AWS credentials in GitHub.

## Getting started

1. Install dependencies

```
yarn
```
