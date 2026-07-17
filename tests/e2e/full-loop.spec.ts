import { test, expect, type Page } from '@playwright/test';

/**
 * The full web-page flow against synthetic mock data: provider creates and walks
 * a report, the patient clears the last-name + date-of-birth gate and reads the
 * results. Also covers the held-for-critical state and the gate rejection.
 */

async function signIn(page: Page): Promise<void> {
  await page.goto('/provider/sign-in');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Reports', exact: true })).toBeVisible();
}

test('provider creates a report, walks it, and the patient reads it', async ({ page }) => {
  await signIn(page);

  await page.getByRole('link', { name: 'New report' }).first().click();
  await page.getByLabel('Patient name').fill('Jordan Pat');
  await page.getByLabel('Patient email').fill('jordan.pat@example.test');
  await page.getByLabel('Patient date of birth').fill('1990-04-15');
  await page.getByRole('button', { name: 'Create report' }).click();

  await page.getByRole('button', { name: 'Read the results' }).click();
  await page.getByRole('button', { name: 'Confirm results' }).click();
  await page.getByRole('button', { name: /Approve for the patient/ }).click();
  await page.getByRole('button', { name: 'Send to patient' }).click();

  const link = page.getByRole('link', { name: /^\/r\// });
  await expect(link).toBeVisible();
  const href = await link.getAttribute('href');
  if (href === null) throw new Error('no patient link after send');

  await page.goto(href);
  await page.getByLabel('Last name').fill('Pat');
  await page.getByLabel('Month').fill('4');
  await page.getByLabel('Day').fill('15');
  await page.getByLabel('Year').fill('1990');
  await page.getByRole('button', { name: 'View my results' }).click();

  await expect(page.getByRole('heading', { name: /here are your results/ })).toBeVisible();
  await expect(page.getByText(/not medical advice/)).toBeVisible();
});

test('a critical result holds the report and is not sent', async ({ page }) => {
  await signIn(page);
  await page.getByRole('link', { name: /David Chen/ }).click();
  await expect(
    page.getByRole('heading', { name: /Held: contact the patient directly/ }),
  ).toBeVisible();
  await expect(page.getByText('Potassium')).toBeVisible();
});

test('the patient gate rejects wrong info and accepts the right last name and DOB', async ({
  page,
}) => {
  await page.goto('/r/demo-alvarez-token');
  await expect(page.getByRole('heading', { name: /shared your lab results/ })).toBeVisible();

  await page.getByLabel('Last name').fill('Wrong');
  await page.getByLabel('Month').fill('3');
  await page.getByLabel('Day').fill('12');
  await page.getByLabel('Year').fill('1984');
  await page.getByRole('button', { name: 'View my results' }).click();
  await expect(page.getByText(/did not match/)).toBeVisible();

  await page.getByLabel('Last name').fill('Alvarez');
  await page.getByLabel('Month').fill('3');
  await page.getByLabel('Day').fill('12');
  await page.getByLabel('Year').fill('1984');
  await page.getByRole('button', { name: 'View my results' }).click();
  await expect(page.getByRole('heading', { name: /here are your results/ })).toBeVisible();
});
