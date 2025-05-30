Feature: Level 1 - Human login to Azure Portal
 
  Scenario: User logs in to Azure Portal
    Given a user with a valid Entra ID
    When the user logs in to the Azure Portal
    Then the user receives a 200 OK response and is on the portal homepage
 