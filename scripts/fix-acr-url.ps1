#!/usr/bin/env pwsh
# This script fixes the ACR URL duplication issue in GitHub Actions workflow

$workflowFile = "c:\fedident\zerotrust-cloud-identity\.github\workflows\workload.yml"
$content = Get-Content $workflowFile -Raw

# Fix the login-server and image references
$content = $content -replace '\.azurecr\.io\.azurecr\.io', '.azurecr.io'

# Ensure correct structure by fixing common issues
$content = $content -replace 'login-server: \${{ vars.ACR_NAME }}\.azurecr\.io', 'login-server: ${{ vars.ACR_NAME }}'
$content = $content -replace 'image: \${{ vars.ACR_NAME }}\.azurecr\.io', 'image: ${{ vars.ACR_NAME }}'
$content = $content -replace 'registry-server: \${{ vars.ACR_NAME }}\.azurecr\.io', 'registry-server: ${{ vars.ACR_NAME }}'

# Write the fixed content back to the file
$content | Set-Content $workflowFile -NoNewline

Write-Host "Fixed workflow file. Please verify the changes before committing."
