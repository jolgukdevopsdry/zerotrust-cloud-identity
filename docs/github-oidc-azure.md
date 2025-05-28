# GitHub Actions OIDC Authentication with Azure

This document explains how to set up OpenID Connect (OIDC) authentication between GitHub Actions and Azure, which is required for the workflow in this repository.

## Background

OIDC (OpenID Connect) allows GitHub Actions workflows to authenticate with Azure without storing long-lived credentials as secrets. Instead, the workflow exchanges a short-lived token for an access token directly from Azure.

## Common Issues

If you're seeing authentication errors in your GitHub Actions workflow that mention OIDC or "azure/login", it's likely due to one of these issues:

1. Missing federated credential in Azure AD
2. Incorrect subject configuration in the federated credential
3. Wrong audience value in the GitHub Actions workflow
4. Insufficient permissions for the Azure AD application

## Setup Instructions

### Prerequisites

- Azure CLI installed
- PowerShell or PowerShell Core
- Owner or sufficient permissions in your Azure AD tenant and subscription
- GitHub repository information

### Using the Setup Script

We've provided a setup script that configures the necessary federated credentials in Azure AD:

```powershell
./scripts/setup-github-oidc.ps1 `
  -ApplicationClientId "your-application-client-id" `
  -SubscriptionId "your-subscription-id" `
  -TenantId "your-tenant-id" `
  -ResourceGroup "your-resource-group" `
  -GitHubOrg "your-github-organization" `
  -GitHubRepo "your-github-repository-name"
```

Replace the parameters with your actual values.

### Manual Configuration

If you prefer to set up the federated credentials manually:

1. Go to the Azure Portal
2. Navigate to Azure Active Directory > App Registrations
3. Select your application
4. Go to "Certificates & secrets" > "Federated credentials"
5. Click "Add credential"
6. Select "GitHub Actions deploying Azure resources" scenario
7. Fill in the details:
   - Organization: your GitHub org name
   - Repository: your GitHub repo name
   - Entity type: "Branch"
   - GitHub branch: "main" (repeat for "jonewworkload")
   - Name: "github-actions-main" (or "github-actions-jonewworkload")
8. Click "Add"

### GitHub Secrets

Ensure the following secrets are set in your GitHub repository:

- `AZURE_CLIENT_ID`: The application client ID
- `AZURE_TENANT_ID`: Your Azure AD tenant ID
- `AZURE_SUBSCRIPTION_ID`: Your Azure subscription ID

## Troubleshooting

If you continue to experience authentication issues:

1. Check that the federated credentials are properly configured in Azure AD
2. Verify that the subject in the federated credential exactly matches your GitHub workflow identity
3. Ensure the application has sufficient permissions to access the resources
4. Check that the `audience` parameter is set to `api://AzureADTokenExchange` in your workflow

For more information, see the [official Microsoft documentation](https://docs.microsoft.com/en-us/azure/developer/github/connect-from-github).
