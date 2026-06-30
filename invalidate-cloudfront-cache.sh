#!/usr/bin/env bash
#
# Create a CloudFront invalidation so edge caches pick up new S3 objects after deploy.
#
# Usage:
#   ./invalidate-cloudfront-cache.sh <distribution-id> [path ...]
#
# When no paths are given, defaults to a single path: /*
#
# Examples:
#   ./invalidate-cloudfront-cache.sh E1234567890ABC
#   ./invalidate-cloudfront-cache.sh E1234567890ABC /index.html "/css/*"
#
# Prerequisites: AWS CLI v2, cloudfront:CreateInvalidation.
#
# Environment (optional):
#   AWS_PAGER               — set to empty to disable pager (this script exports AWS_PAGER='')
#
# Cost: AWS includes a free invalidation allowance per month; heavy use can incur charges.
# Prefer versioned asset URLs for bulk static files if you invalidate constantly.
#
set -euo pipefail

export AWS_PAGER="${AWS_PAGER:-}"

usage() {
  echo "Usage: $0 <distribution-id> [path ...]" >&2
  echo "Default paths when none given: /*" >&2
  echo "Example: $0 E1ABCDEFG2H3I4 /index.html" >&2
  exit 1
}

DIST_ID="${1:-}"
[[ -n "$DIST_ID" ]] || usage
shift || true

if [[ $# -eq 0 ]]; then
  PATHS=("/*")
else
  PATHS=("$@")
fi

CALLER_REF="invalidate-$(date +%s)-${RANDOM}"

echo "Distribution: ${DIST_ID}"
echo "Paths:        ${PATHS[*]}"
echo ""

PATHS_JSON="$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1:]))' "${PATHS[@]}")"

INV_JSON="$(
  DIST_ID="$DIST_ID" CALLER_REF="$CALLER_REF" PATHS_JSON="$PATHS_JSON" python3 - <<'PY'
import json
import os

dist = os.environ["DIST_ID"]
caller = os.environ["CALLER_REF"]
paths = json.loads(os.environ["PATHS_JSON"])
doc = {
    "DistributionId": dist,
    "InvalidationBatch": {
        "Paths": {"Quantity": len(paths), "Items": paths},
        "CallerReference": caller,
    },
}
print(json.dumps(doc))
PY
)"

OUT="$(aws cloudfront create-invalidation --cli-input-json "$INV_JSON" --output json)"
INV_ID="$(echo "$OUT" | python3 -c "import json,sys; print(json.load(sys.stdin)['Invalidation']['Id'])")"
STATUS="$(echo "$OUT" | python3 -c "import json,sys; print(json.load(sys.stdin)['Invalidation']['Status'])")"

echo "Invalidation ID: ${INV_ID}"
echo "Status:          ${STATUS}"
echo ""
echo "Check: aws cloudfront get-invalidation --distribution-id ${DIST_ID} --id ${INV_ID}"
