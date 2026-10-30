# One-command local setup and run for the SplitMint backend (Windows PowerShell).
# Starts PostgreSQL in Docker, then runs the API on http://localhost:8080.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location (Join-Path $root 'backend')
docker compose up -d
if (Test-Path '.\mvnw.cmd') { .\mvnw.cmd spring-boot:run } else { mvn spring-boot:run }
