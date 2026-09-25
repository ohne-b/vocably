#!/usr/bin/env bash

# Runs grammar-and-style.mts for every .html and .json file in a folder (recursively).
#
# Usage:
#   ./grammar-batch.sh <path/to/folder>

set -uo pipefail

if [ $# -lt 1 ] || [ ! -d "$1" ]; then
  echo "Usage: grammar-batch.sh <path/to/folder>" >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
failed=()

while IFS= read -r -d '' file; do
  echo "==> $file"
  if ! "$script_dir/grammar-and-style.mts" "$file"; then
    failed+=("$file")
  fi
  echo
done < <(find "$1" -type f \( -iname '*.html' -o -iname '*.json' \) -print0 | sort -z)

if [ ${#failed[@]} -gt 0 ]; then
  echo "Failed files:" >&2
  printf '  %s\n' "${failed[@]}" >&2
  exit 1
fi

echo "All files processed."
