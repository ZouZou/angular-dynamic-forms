# E2E Testing Guide

Comprehensive guide for End-to-End (E2E) testing of Angular Dynamic Forms using Playwright.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing E2E Tests](#writing-e2e-tests)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Overview

### What is E2E Testing?

End-to-End testing validates the complete user journey through your application, ensuring all components work together correctly in a real browser environment.

### Why Playwright?

- **Multi-browser support**: Chromium, Firefox, WebKit (Safari)
- **Mobile testing**: Test on mobile viewports and devices
- **Fast execution**: Parallel test execution
- **Auto-waiting**: Smart waiting for elements
- **Debugging tools**: UI mode, trace viewer, screenshots, videos
- **TypeScript support**: Full type safety

### Test Coverage

Our E2E test suite covers:
- ✅ **Basic form interactions** (18 tests)
- ✅ **Form validation** (15 tests)
- ✅ **Complex scenarios** (25+ tests)
  - Conditional visibility
  - Dependent dropdowns
  - Computed fields
  - Array/repeater fields
  - Form submission
  - Autosave
  - Responsive behavior
  - Accessibility

**Total: 58+ E2E test cases**

---

## Setup

### Prerequisites

```bash
Node.js >= 18
npm >= 9
```

### Installation

1. **Install Playwright:**

```bash
cd angular-dynamic-forms
npm install --save-dev @playwright/test@latest
```

2. **Install Browsers:**

```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit browsers.

3. **Verify Installation:**

```bash
npx playwright --version
```

### Project Structure

```
angular-dynamic-forms/
├── e2e/
│   ├── basic-form-interactions.spec.ts   # Basic field interactions
│   ├── form-validation.spec.ts           # Validation scenarios
│   └── complex-scenarios.spec.ts         # Advanced features
├── playwright.config.ts                   # Playwright configuration
├── playwright-report/                     # HTML test reports
└── test-results/                          # Test artifacts
```

---

## Running Tests

### All E2E Tests

```bash
npm run test:e2e
```

Runs all tests in headless mode across all configured browsers.

### UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

Opens Playwright UI for:
- Running tests interactively
- Debugging failures
- Inspecting test steps
- Time-travel debugging

### Headed Mode (Visible Browser)

```bash
npm run test:e2e:headed
```

Runs tests with visible browser windows (useful for debugging).

### Debug Mode

```bash
npm run test:e2e:debug
```

Runs tests in debug mode with Playwright Inspector for step-by-step execution.

### Specific Test File

```bash
npx playwright test basic-form-interactions
```

### Specific Test Case

```bash
npx playwright test -g "should load and display form"
```

### Single Browser

```bash
npx playwright test --project=chromium
```

Available projects:
- `chromium` - Desktop Chrome
- `firefox` - Desktop Firefox
- `webkit` - Desktop Safari
- `Mobile Chrome` - Android mobile
- `Mobile Safari` - iOS mobile
- `iPad` - iPad tablet

### Run Tests in Parallel

```bash
npx playwright test --workers=4
```

Runs up to 4 tests concurrently.

### View Test Report

```bash
npm run test:e2e:report
```

Opens HTML report with test results, screenshots, and videos.

---

## Test Structure

### Test File Organization

Each test file follows this structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
  });

  test.describe('Sub-feature', () => {
    // Nested test group
  });
});
```

### Page Object Pattern

For complex tests, use Page Objects:

```typescript
// pages/form-page.ts
import { Page } from '@playwright/test';

export class FormPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/demo');
  }

  async fillTextField(name: string, value: string) {
    await this.page.locator(`input[name="${name}"]`).fill(value);
  }

  async submitForm() {
    await this.page.locator('button[type="submit"]').click();
  }
}

// In test file
import { FormPage } from './pages/form-page';

test('should submit form', async ({ page }) => {
  const formPage = new FormPage(page);
  await formPage.goto();
  await formPage.fillTextField('username', 'JohnDoe');
  await formPage.submitForm();
});
```

---

## Writing E2E Tests

### Locator Strategies

**Recommended Priority:**

1. **By Role** (most resilient):
```typescript
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByRole('textbox', { name: 'Username' }).fill('JohnDoe');
```

2. **By Label**:
```typescript
await page.getByLabel('Email').fill('test@example.com');
```

3. **By Placeholder**:
```typescript
await page.getByPlaceholder('Enter your name').fill('John');
```

4. **By Test ID**:
```typescript
await page.getByTestId('submit-button').click();
```

5. **By CSS Selector** (last resort):
```typescript
await page.locator('input[name="username"]').fill('JohnDoe');
```

### Common Actions

**Fill Input:**
```typescript
await page.locator('input[name="email"]').fill('test@example.com');
```

**Click Element:**
```typescript
await page.locator('button[type="submit"]').click();
```

**Select Dropdown:**
```typescript
await page.locator('select[name="country"]').selectOption('USA');
await page.locator('select[name="country"]').selectOption({ label: 'United States' });
```

**Check/Uncheck:**
```typescript
await page.locator('input[type="checkbox"]').check();
await page.locator('input[type="checkbox"]').uncheck();
```

**Wait for Element:**
```typescript
await page.locator('.success-message').waitFor({ state: 'visible' });
```

**Get Text Content:**
```typescript
const text = await page.locator('h1').textContent();
```

### Assertions

**Visibility:**
```typescript
await expect(page.locator('.success')).toBeVisible();
await expect(page.locator('.error')).toBeHidden();
```

**Value:**
```typescript
await expect(page.locator('input[name="username"]')).toHaveValue('JohnDoe');
```

**Text Content:**
```typescript
await expect(page.locator('h1')).toHaveText('Welcome');
await expect(page.locator('.error')).toContainText('required');
```

**Count:**
```typescript
await expect(page.locator('.field-group')).toHaveCount(5);
```

**Attribute:**
```typescript
await expect(page.locator('input')).toHaveAttribute('required', '');
```

**State:**
```typescript
await expect(page.locator('button')).toBeEnabled();
await expect(page.locator('input')).toBeDisabled();
await expect(page.locator('input[type="checkbox"]')).toBeChecked();
```

### Handling Async Operations

**Auto-waiting:**
```typescript
// Playwright automatically waits for element to be actionable
await page.locator('button').click();
```

**Explicit Wait:**
```typescript
await page.waitForTimeout(1000); // Wait 1 second
await page.waitForLoadState('networkidle'); // Wait for network to be idle
await page.waitForSelector('.dynamic-content'); // Wait for selector
```

**Wait for API Response:**
```typescript
const responsePromise = page.waitForResponse('/api/submit');
await page.locator('button[type="submit"]').click();
const response = await responsePromise;
```

---

## Best Practices

### 1. Use Descriptive Test Names

❌ **Bad:**
```typescript
test('test 1', async ({ page }) => { ... });
```

✅ **Good:**
```typescript
test('should show error when submitting empty required field', async ({ page }) => { ... });
```

### 2. Keep Tests Independent

Each test should run independently:

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/demo');
  // Reset state for each test
});
```

### 3. Use Appropriate Waits

❌ **Bad:**
```typescript
await page.waitForTimeout(5000); // Arbitrary wait
```

✅ **Good:**
```typescript
await page.waitForLoadState('networkidle');
await page.locator('.content').waitFor({ state: 'visible' });
```

### 4. Handle Flaky Tests

**Add Retry:**
```typescript
test.describe.configure({ retries: 2 });
```

**Use Soft Assertions:**
```typescript
await expect.soft(page.locator('.warning')).toBeVisible();
// Test continues even if this fails
```

### 5. Clean Up After Tests

```typescript
test.afterEach(async ({ page }) => {
  // Clear localStorage
  await page.evaluate(() => localStorage.clear());
});
```

### 6. Use Test Fixtures

```typescript
import { test as base } from '@playwright/test';

type MyFixtures = {
  formPage: FormPage;
};

const test = base.extend<MyFixtures>({
  formPage: async ({ page }, use) => {
    const formPage = new FormPage(page);
    await formPage.goto();
    await use(formPage);
  },
});

test('should fill form', async ({ formPage }) => {
  await formPage.fillTextField('username', 'JohnDoe');
});
```

### 7. Test Across Browsers

```typescript
// playwright.config.ts
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
]
```

### 8. Mobile Testing

```typescript
test('should work on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  // Test mobile-specific behavior
});
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

### Docker

```dockerfile
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

CMD ["npm", "run", "test:e2e"]
```

---

## Troubleshooting

### Common Issues

**1. Browser not found:**
```bash
npx playwright install
```

**2. Port 4200 already in use:**
```bash
# Kill process on port 4200
lsof -ti:4200 | xargs kill -9
```

**3. Tests timing out:**

Increase timeout in `playwright.config.ts`:
```typescript
use: {
  actionTimeout: 30000, // 30 seconds
}
```

**4. Flaky tests:**

- Add retries: `test.describe.configure({ retries: 2 })`
- Use better waits instead of `waitForTimeout`
- Check for race conditions

**5. Element not found:**

- Use `page.pause()` to inspect page state
- Check selector with `page.locator('.selector').highlight()`
- Use UI mode: `npm run test:e2e:ui`

### Debug Tools

**Playwright Inspector:**
```bash
npm run test:e2e:debug
```

**Trace Viewer:**
```bash
npx playwright show-trace trace.zip
```

**Screenshots on Failure:**

Already configured in `playwright.config.ts`:
```typescript
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

**Console Logs:**
```typescript
page.on('console', msg => console.log('PAGE LOG:', msg.text()));
```

---

## Test Metrics

### Current Coverage

- **Test Suites**: 3
- **Test Cases**: 58+
- **Browser Coverage**: Chrome, Firefox, Safari
- **Mobile Coverage**: iOS, Android, iPad
- **Features Tested**:
  - Basic interactions (18 tests)
  - Validation (15 tests)
  - Complex scenarios (25+ tests)

### Performance

- **Average test duration**: 2-5 seconds per test
- **Full suite (single browser)**: ~2-3 minutes
- **Full suite (all browsers)**: ~8-12 minutes
- **Parallel execution**: Yes (4 workers)

---

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Examples](https://playwright.dev/docs/ci)

---

**Last Updated:** 2025-12-26
**Playwright Version:** 1.49.0
**Node Version:** 18+
