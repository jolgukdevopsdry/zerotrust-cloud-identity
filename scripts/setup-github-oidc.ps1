#!/usr/bin/env pwsh
# This script sets up GitHub OIDC authentication with Azure
# It creates a federated credential in Azure AD for GitHub Actions

# Parameters
param(
    [Parameter(Mandatory=$true)]
    [string]$ApplicationClientId,
    
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$true)]
    [string]$TenantId,
    
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,
    
    [Parameter(Mandatory=$true)]
    [string]$GitHubOrg,
    
    [Parameter(Mandatory=$true)]
    [string]$GitHubRepo
)

# Login to Azure
Write-Host "Logging in to Azure..."
az login --tenant $TenantId
az account set --subscription $SubscriptionId

# Set the correct subject identifier format for GitHub Actions
$subjectMain = "repo:${GitHubOrg}/${GitHubRepo}:ref:refs/heads/main"
$subjectJonewworkload = "repo:${GitHubOrg}/${GitHubRepo}:ref:refs/heads/jonewworkload"

# Check if the app registration exists
Write-Host "Checking for app registration with client ID: $ApplicationClientId"
$appInfo = az ad app show --id $ApplicationClientId | ConvertFrom-Json

if (-not $appInfo) {
    Write-Error "Application with client ID $ApplicationClientId not found. Please provide a valid client ID."
    exit 1
}

# Create federated credential for main branch
Write-Host "Creating federated credential for main branch..."
$fedCredMainJson = @"
{
    "name": "github-actions-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "$subjectMain",
    "description": "GitHub Actions workflow for main branch",
    "audiences": ["api://AzureADTokenExchange"]
}
"@

$fedCredMainJson | Set-Content -Path "fedcred-main.json" -Encoding UTF8
az ad app federated-credential create --id $ApplicationClientId --parameters fedcred-main.json
Remove-Item -Path "fedcred-main.json"

# Create federated credential for jonewworkload branch
Write-Host "Creating federated credential for jonewworkload branch..."
$fedCredJonewworkloadJson = @"
{
    "name": "github-actions-jonewworkload",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "$subjectJonewworkload",
    "description": "GitHub Actions workflow for jonewworkload branch",
    "audiences": ["api://AzureADTokenExchange"]
}
"@

$fedCredJonewworkloadJson | Set-Content -Path "fedcred-jonewworkload.json" -Encoding UTF8
az ad app federated-credential create --id $ApplicationClientId --parameters fedcred-jonewworkload.json
Remove-Item -Path "fedcred-jonewworkload.json"

# Give the application required permissions to the resource group
Write-Host "Assigning Contributor role to the application for the resource group..."
$scope = "/subscriptions/$SubscriptionId/resourceGroups/$ResourceGroup"
az role assignment create --assignee $ApplicationClientId --role Contributor --scope $scope

Write-Host "OIDC setup complete! GitHub Actions workflow should now be able to authenticate with Azure."
Write-Host "Make sure the following secrets are set in your GitHub repository:"
Write-Host "AZURE_CLIENT_ID: $ApplicationClientId"
Write-Host "AZURE_SUBSCRIPTION_ID: $SubscriptionId"
Write-Host "AZURE_TENANT_ID: $TenantId"
