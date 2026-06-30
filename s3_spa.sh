#!/usr/bin/env bash
#
# Thin wrapper: configure SPA routing for bohdan-sudoku via cli-scripts.
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_SCRIPTS="${CLI_SCRIPTS:-${SCRIPT_DIR}/../cli-scripts}"

exec "${CLI_SCRIPTS}/configure-spa-routing.sh" \
  --access-keys-csv "${CLI_ACCESS_KEYS_CSV:-${CLI_SCRIPTS}/CLI-user_accessKeys.csv}" \
  bohdan-sudoku \
  ca-central-1 \
  "$@"
