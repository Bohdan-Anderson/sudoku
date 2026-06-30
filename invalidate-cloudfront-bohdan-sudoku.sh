#!/usr/bin/env bash
# Invalidate CloudFront cache for bohdan-sudoku (bundle-local wrapper).
# Usage: $0 [path ...]  — paths default to /* ; see invalidate-cloudfront-cache.sh
set -euo pipefail
_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${_ROOT}/invalidate-cloudfront-cache.sh" 'E38FWYFXOLY6R4' "$@"
