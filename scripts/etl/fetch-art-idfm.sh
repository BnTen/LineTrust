#!/usr/bin/env bash
# Fetch ART IDFM annual zips into data/raw/art when missing.
# Prefer Actions cache; on miss use ART_IDFM_<YEAR>_URL secrets/env.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DIR="$ROOT/data/raw/art"
mkdir -p "$DIR"

fetch_one() {
  local year="$1"
  local dest="$DIR/idfm_annuel_${year}.zip"
  local url_var="ART_IDFM_${year}_URL"
  local url="${!url_var:-}"

  if [ -f "$dest" ] && [ -s "$dest" ]; then
    echo "OK present: $dest ($(wc -c <"$dest") bytes)"
    return 0
  fi

  if [ -z "$url" ]; then
    echo "Missing $dest and ${url_var} is unset." >&2
    echo "Upload zips to a private HTTPS URL and set GitHub secret ${url_var}," >&2
    echo "or seed the Actions cache from a machine that has data/raw/art/." >&2
    return 1
  fi

  echo "Downloading ${year} → $dest"
  curl -fL --retry 3 --retry-delay 5 -o "$dest.partial" "$url"
  mv "$dest.partial" "$dest"
  echo "Downloaded $dest ($(wc -c <"$dest") bytes)"
}

years=(2023 2024)
fail=0
for y in "${years[@]}"; do
  fetch_one "$y" || fail=1
done
exit "$fail"
