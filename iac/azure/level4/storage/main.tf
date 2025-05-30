terraform {
  required_providers {
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 3.4.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.29.0"
    }
  }
}

provider "azurerm" {
  features {}
}

provider "azuread" {
}

resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = "UK South"
}

resource "azurerm_user_assigned_identity" "uami" {
  name                = "uami-container-access"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
}

data "azurerm_container_app_environment" "existing" {
  name                = var.container_app_env_name
  location            = var.location
  resource_group_name = var.resource_group_name

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.uami.id]
  }
}


resource "azurerm_storage_account" "storage" {
  name                     = var.blobstorageaccountname
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "container" {
  name                  = "mycontainer"
  storage_account_name  = azurerm_storage_account.storage.name
  container_access_type = "private"
}

resource "azurerm_role_assignment" "blob_reader" {
  scope                = azurerm_storage_account.storage.id
  role_definition_name = "Storage Blob Data Reader"
  principal_id         = azurerm_user_assigned_identity.uami.principal_id
}
