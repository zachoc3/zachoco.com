# Deployment

Every push to `main` runs `.github/workflows/deploy.yml`, which uploads the site to S3 and,
if configured, clears the CloudFront cache. It can also be run by hand from the
**Actions** tab ("Deploy to S3" → "Run workflow").

GitHub signs in to AWS with OpenID Connect (OIDC), so no AWS access keys are stored in GitHub.

## One-time AWS setup

### 1. Add GitHub as an identity provider

IAM → **Identity providers** → **Add provider**

- Provider type: **OpenID Connect**
- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

### 2. Create a role for the workflow

IAM → **Roles** → **Create role** → **Web identity**, pick the provider above and audience
`sts.amazonaws.com`. Then replace the role's trust policy with the following, so only the `main`
branch of this repo can use it (replace `ACCOUNT_ID`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          "token.actions.githubusercontent.com:sub": "repo:zachoc3/zachoco.com:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

Attach an inline permissions policy that only allows writing to the site bucket (replace
`BUCKET_NAME`; drop the second statement if there is no CloudFront distribution):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::BUCKET_NAME"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::BUCKET_NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "*"
    }
  ]
}
```

### 3. Configure the GitHub repo

Repo → **Settings** → **Secrets and variables** → **Actions**

| Kind     | Name                         | Value                                           |
| -------- | ---------------------------- | ----------------------------------------------- |
| Secret   | `AWS_ROLE_ARN`               | ARN of the role from step 2                     |
| Variable | `AWS_REGION`                 | Bucket region, e.g. `us-east-1`                 |
| Variable | `S3_BUCKET`                  | Bucket that holds `index.html`                  |
| Variable | `CLOUDFRONT_DISTRIBUTION_ID` | Optional; leave unset if there is no CloudFront |

## Notes

- The sync never deletes files from the bucket. Leftover files from the old template are
  harmless and can be removed by hand.
- `.git/`, `.github/`, and Markdown files are not uploaded.
