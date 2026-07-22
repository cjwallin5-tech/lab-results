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

test('a critical result holds the report, is not sent, and its contact is logged', async ({
  page,
}) => {
  await signIn(page);
  await page.getByRole('link', { name: /David Chen/ }).click();
  await expect(
    page.getByRole('heading', { name: /Held: contact the patient directly/ }),
  ).toBeVisible();
  await expect(page.getByText('Potassium 6.8 mmol/L')).toBeVisible();
  // Held report: nothing is sent (no patient link) and its status says held.
  await expect(page.getByRole('link', { name: /^\/r\// })).toHaveCount(0);
  await expect(page.getByText(/Held: critical result/)).toBeVisible();
  await expect(page.getByText(/still to contact/)).toBeVisible();

  // Record the direct contact and confirm it is documented on the page.
  await page
    .getByPlaceholder(/Who you reached/)
    .fill('Reached David by phone; advised same-day visit.');
  await page.getByRole('button', { name: 'Record contact' }).click();
  await expect(page.getByText('Contacted')).toBeVisible();
  await expect(page.getByText(/advised same-day visit/)).toBeVisible();
  await expect(page.getByText(/Every critical result has a logged contact/)).toBeVisible();
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

async function openPatient(
  page: Page,
  token: string,
  last: string,
  m: string,
  d: string,
  y: string,
) {
  await page.goto(`/r/${token}`);
  await page.getByLabel('Last name').fill(last);
  await page.getByLabel('Month').fill(m);
  await page.getByLabel('Day').fill(d);
  await page.getByLabel('Year').fill(y);
  await page.getByRole('button', { name: 'View my results' }).click();
  await expect(page.getByRole('heading', { name: /here are your results/ })).toBeVisible();
}

test('an all-in-range report shows the every-result-typical affirmation', async ({ page }) => {
  await openPatient(page, 'demo-nguyen-token', 'Nguyen', '9', '14', '1979');
  await expect(page.getByText(/Every result in the typical range/)).toBeVisible();
});

test('an implausible value is flagged to double-check, never explained as real', async ({
  page,
}) => {
  await openPatient(page, 'demo-park-token', 'Park', '2', '28', '1995');
  await expect(page.getByText('Please double-check').first()).toBeVisible();
  await expect(page.getByText(/looks unusual and will be double-checked/)).toBeVisible();
});
