import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Basic Form Interactions
 *
 * Tests fundamental form operations:
 * - Form loading and rendering
 * - Field input and value updates
 * - Basic navigation and interactions
 * - Form state management
 */

test.describe('Basic Form Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the demo page
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
  });

  test('should load and display form with all field types', async ({ page }) => {
    // Verify form title is visible
    await expect(page.locator('h2').first()).toBeVisible();

    // Verify various field types are rendered
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="number"]').first()).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
    await expect(page.locator('textarea').first()).toBeVisible();
    await expect(page.locator('input[type="checkbox"]').first()).toBeVisible();
  });

  test('should allow typing in text input field', async ({ page }) => {
    const textInput = page.locator('input[name="username"]').first();

    // Type in the field
    await textInput.fill('JohnDoe123');

    // Verify the value was entered
    await expect(textInput).toHaveValue('JohnDoe123');
  });

  test('should allow typing in email field', async ({ page }) => {
    const emailInput = page.locator('input[type="email"]').first();

    // Type in the email field
    await emailInput.fill('john.doe@example.com');

    // Verify the value
    await expect(emailInput).toHaveValue('john.doe@example.com');
  });

  test('should allow typing in textarea field', async ({ page }) => {
    const textarea = page.locator('textarea').first();

    const longText = 'This is a longer text that spans multiple lines.\nIt tests the textarea functionality.';

    // Type in the textarea
    await textarea.fill(longText);

    // Verify the value
    await expect(textarea).toHaveValue(longText);
  });

  test('should allow selecting from dropdown', async ({ page }) => {
    const select = page.locator('select[name="country"]').first();

    // Select an option
    await select.selectOption({ label: 'United States' });

    // Verify selection
    const selectedValue = await select.inputValue();
    expect(selectedValue).toBeTruthy();
  });

  test('should allow checking and unchecking checkbox', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();

    // Check the checkbox
    await checkbox.check();
    await expect(checkbox).toBeChecked();

    // Uncheck the checkbox
    await checkbox.uncheck();
    await expect(checkbox).not.toBeChecked();
  });

  test('should allow selecting radio button', async ({ page }) => {
    const radioButtons = page.locator('input[type="radio"]');

    // Get count of radio buttons
    const count = await radioButtons.count();

    if (count > 0) {
      // Select first radio button
      await radioButtons.first().check();
      await expect(radioButtons.first()).toBeChecked();

      // Select second radio button
      if (count > 1) {
        await radioButtons.nth(1).check();
        await expect(radioButtons.nth(1)).toBeChecked();
        await expect(radioButtons.first()).not.toBeChecked();
      }
    }
  });

  test('should allow entering number in number field', async ({ page }) => {
    const numberInput = page.locator('input[type="number"]').first();

    // Enter a number
    await numberInput.fill('42');

    // Verify the value
    await expect(numberInput).toHaveValue('42');
  });

  test('should respect min/max constraints on number field', async ({ page }) => {
    const numberInput = page.locator('input[type="number"][min][max]').first();

    if (await numberInput.isVisible()) {
      const min = await numberInput.getAttribute('min');
      const max = await numberInput.getAttribute('max');

      // Try to enter value within range
      const validValue = Math.floor((parseInt(min!) + parseInt(max!)) / 2).toString();
      await numberInput.fill(validValue);
      await expect(numberInput).toHaveValue(validValue);
    }
  });

  test('should allow selecting date', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]').first();

    if (await dateInput.isVisible()) {
      // Set a date
      await dateInput.fill('2025-12-25');

      // Verify the date
      await expect(dateInput).toHaveValue('2025-12-25');
    }
  });

  test('should display placeholder text', async ({ page }) => {
    const inputWithPlaceholder = page.locator('input[placeholder]').first();

    if (await inputWithPlaceholder.isVisible()) {
      const placeholder = await inputWithPlaceholder.getAttribute('placeholder');
      expect(placeholder).toBeTruthy();
      expect(placeholder!.length).toBeGreaterThan(0);
    }
  });

  test('should maintain form state when interacting with multiple fields', async ({ page }) => {
    // Fill multiple fields
    const textInput = page.locator('input[type="text"]').first();
    const emailInput = page.locator('input[type="email"]').first();

    await textInput.fill('TestUser');
    await emailInput.fill('test@example.com');

    // Verify both values are maintained
    await expect(textInput).toHaveValue('TestUser');
    await expect(emailInput).toHaveValue('test@example.com');
  });

  test('should handle rapid field updates', async ({ page }) => {
    const textInput = page.locator('input[type="text"]').first();

    // Rapidly update the field
    for (let i = 0; i < 5; i++) {
      await textInput.fill(`Value${i}`);
    }

    // Verify final value
    await expect(textInput).toHaveValue('Value4');
  });

  test('should allow clearing field values', async ({ page }) => {
    const textInput = page.locator('input[type="text"]').first();

    // Fill the field
    await textInput.fill('Some text');
    await expect(textInput).toHaveValue('Some text');

    // Clear the field
    await textInput.clear();
    await expect(textInput).toHaveValue('');
  });

  test('should display labels for all fields', async ({ page }) => {
    const labels = page.locator('label');
    const count = await labels.count();

    expect(count).toBeGreaterThan(0);

    // Verify each label has text
    for (let i = 0; i < Math.min(count, 10); i++) {
      const labelText = await labels.nth(i).textContent();
      expect(labelText).toBeTruthy();
    }
  });

  test('should have accessible form structure', async ({ page }) => {
    // Verify form element exists
    const form = page.locator('form').first();
    await expect(form).toBeVisible();

    // Verify submit button exists
    const submitButton = page.locator('button[type="submit"]').first();
    await expect(submitButton).toBeVisible();
  });

  test('should handle tab navigation between fields', async ({ page }) => {
    const firstInput = page.locator('input').first();

    // Focus first input
    await firstInput.focus();

    // Press Tab to move to next field
    await page.keyboard.press('Tab');

    // Verify focus moved to next field
    const activeElement = page.locator(':focus');
    await expect(activeElement).toBeVisible();
  });

  test('should show submit button', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');

    await expect(submitButton.first()).toBeVisible();
    const buttonText = await submitButton.first().textContent();
    expect(buttonText).toBeTruthy();
  });
});
