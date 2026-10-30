#!/usr/bin/env bash
# One-command local setup and run for the SplitMint backend.
set -euo pipefail
cd "$(dirname "$0")/../backend"
docker compose up -d
./mvnw spring-boot:run
