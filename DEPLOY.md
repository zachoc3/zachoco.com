# Deployment

The site is a private S3 bucket (`zachoco`, us-east-1) behind CloudFront (`E13ZSBIKZY30W0`).

Every push to `main` runs `.github/workflows/deploy.yml`, which:

1. Signs in to AWS as `GitHubActionsZachocoDeployRole` using OpenID Connect, so no AWS keys are
   stored in GitHub.
2. Syncs the repo to the bucket with `--delete`, so the bucket always matches `main`.
   `.git/`, `.github/`, and Markdown files are not uploaded.
3. Invalidates the CloudFront cache so changes show up right away.

It can also be run by hand from the **Actions** tab ("Deploy to AWS" → "Run workflow").

## Security headers

CloudFront adds security headers through the response headers policy
`zachoco-security-headers-v3`, which is already attached to the distribution. Its
Content-Security-Policy only allows scripts, styles, and fonts served from zachoco.com itself, so
**inline `<script>` and `<style>` tags and `style="..."` attributes are blocked**. Put CSS in
`assets/css/style.css` and any JavaScript in a separate `.js` file.

## IAM role

The role's trust policy must allow this repo's `main` branch:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::655311368493:oidc-provider/token.actions.githubusercontent.com"
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

Its permissions need `s3:ListBucket` on `arn:aws:s3:::zachoco`, `s3:GetObject`,
`s3:PutObject` and `s3:DeleteObject` on `arn:aws:s3:::zachoco/*`, and
`cloudfront:CreateInvalidation` on the distribution.
