# Static site deploy kit (bohdan-sudoku)

This folder was produced by `provision-static-site-uploader-bundle.sh`. Use it with the **limited IAM user** created for this bucket so you can publish updates without admin access.

## What you need

- [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) installed
- **AWS credentials** for the limited IAM user

If `uploader-aws-credentials.env` is in this folder, it was generated when the kit was built (**contains a secret**). Load it into your shell, then **delete the file** or move it to a password manager—do not commit it or leave it on shared disks.

```bash
set -a && source ./uploader-aws-credentials.env && set +a
# … run upload / invalidate …
rm -f ./uploader-aws-credentials.env
```

If that file is missing, ask the admin to create an access key for your IAM user (`CREATE_ACCESS_KEY=1` when running `create-specific-user.sh`) and configure `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` yourself (same region as the bucket: `ca-central-1`).

## Live URLs

- **HTTPS (CloudFront):** https://d327h6hurcq4re.cloudfront.net/
- **S3 website (direct):** only for debugging; production traffic should use CloudFront.

## Deploy flow

1. **Upload** your built static files (default source is `./dist`):

   ```bash
   ./upload-bohdan-sudoku.sh /path/to/your/build --delete
   ```

   Omit the path to use `./dist`, or set `UPLOAD_SRC` and run without a first argument.

2. **Invalidate CloudFront** so viewers see new content (otherwise edges may serve cached files for a while):

   ```bash
   ./invalidate-cloudfront-bohdan-sudoku.sh
   ```

   Optional paths (instead of default `/*`):

   ```bash
   ./invalidate-cloudfront-bohdan-sudoku.sh /index.html /assets/*
   ```

## Reference

- `cloudfront-bohdan-sudoku.env` — distribution id and domain (`source` it in shell if useful).
- `uploader-aws-credentials.env` — optional; present only when a new access key was created for this kit.
- `.gitignore` — if you turn this folder into a git repo, it ignores the credentials file so it is harder to commit by mistake (still prefer deleting the file after use).

## Notes

- First time CloudFront is created, the HTTPS URL can take **several minutes** to fully deploy.
- Invalidations have a [monthly free tier](https://aws.amazon.com/cloudfront/pricing/); prefer cache-friendly filenames or versioning for heavy churn.
- Your IAM policy allows **upload** and **invalidate** for this site only—not bucket deletion, new distributions, or other AWS services.
