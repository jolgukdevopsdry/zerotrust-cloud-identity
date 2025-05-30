import { Given, When, Then, After } from '@cucumber/cucumber';
import { expect } from 'chai';
import { Browser, BrowserContext, chromium, Page } from 'playwright';
import { setDefaultTimeout } from '@cucumber/cucumber';
 
setDefaultTimeout(5 * 60 * 1000); // Set default timeout for all steps to 5 minutes
 
// Store browser and page context at a higher scope for use across steps
let browser: Browser;
let context: BrowserContext;
let page: Page;
let username: string;
let password: string;
 
// Load environment variables
// NOTE: Store these in .env file which should be in .gitignore
// or use Azure KeyVault in a production environment
Given('a user with a valid Entra ID', async function(): Promise<void> {
  // Check if credentials are available in environment variables
  username = process.env.AZURE_TEST_USERNAME || '';
  password = process.env.AZURE_TEST_PASSWORD || '';
  if (!username || !password) {
    throw new Error('Azure credentials not found in environment variables. Set AZURE_TEST_USERNAME and AZURE_TEST_PASSWORD');
  }
 
  // Initialize browser - using chromium but could use firefox or webkit
  browser = await chromium.launch({
    headless: process.env.CI === 'true', // Headless in CI, headed locally for debugging
    slowMo: 100 // Slow down operations to make them visible when debugging
  });
  // Create a new context
  context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
  });
  // Create a new page
  page = await context.newPage();
  // Log test initialization
  console.log('Initialized browser for Azure portal login test');
});
 
When('the user logs in to the Azure Portal', async function(): Promise<void> {
  // Navigate to Azure portal
  await page.goto('https://portal.azure.com', { 
    waitUntil: 'networkidle',
    timeout: 180000 // Azure portal can be slow, use a longer timeout
  });
  try {
    // Fill in username
    await page.fill('input[type="email"]', username);
    await page.click('input[type="submit"]', { timeout: 180000 });
    // Wait for password field (with a reasonable timeout)
    await page.waitForSelector('input[type="password"]', { timeout: 180000 });
    // Fill in password
    await page.fill('input[type="password"]', password);
    await page.click('input[type="submit"]', { timeout: 180000 });
    // Manual MFA
    await Promise.race([
  page.waitForURL('https://portal.azure.com/#home', { timeout: 60000 }),
  page.waitForSelector('#idDiv_SAOTCAS_TD',    { timeout: 60000 }) // error div
]);
 
    // Wait for portal to load - this can take time
    await page.waitForSelector('.fxs-portal', { timeout: 180000 });
  } catch (error) {
    console.error('Login process failed:', error);
    throw error;
  }
});
 
Then('the user receives a 200 OK response and is on the portal homepage', async function(): Promise<void> {
  // Verify we're on the portal
  const portalElement = await page.$('.fxs-portal');
  expect(portalElement).to.not.be.null;
  // Get the current URL to verify we're on the portal
  const currentUrl = page.url();
  expect(currentUrl).to.include('portal.azure.com');
 
After(async function(): Promise<void> {
  try {
    if (browser) {
      await browser.close();
      console.log('Browser closed successfully');
    }
  } catch (error) {
    console.error('Error closing browser:', error);
  }
})});