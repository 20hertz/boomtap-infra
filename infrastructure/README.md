## Setup

1. Install dependencies

```
yarn
```

2. Bootstrap everything

```
yarn bootstrap:staging
```

3. Deploy hosted zones with TLS certificates

   Deploying CertifiedDomainStack for the first time requires a little attention. It will stall until the delegated domain values have been updated.

- In console, head over to the new Hosted Zone
- Copy the value for the NS record
- Head over to the account (Prod) that owns the domain apex
- update the matching record with the copied NS values

4. Deploy the SPA stacks
