import { test, expect, type Page } from "@playwright/test";

/**
 * The full loop on synthetic data: provider signs in, reads a report, verifies,
 * approves, and sends; the patient clears the date-of-birth gate and reads the
 * results. Covers the safety-critical states: critical, implausible, not covered.
 */

async function signIn(page: Page): Promise<void> {
  await page.goto("/provider/sign-in");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
}

async function walkReportToSent(page: Page, patientName: string): Promise<string> {
  await page.getByRole("link", { name: new RegExp(patientName) }).click();
  await page.getByRole("button", { name: "Read the results" }).click();
  await page.getByRole("button", { name: /Confirm results/ }).click();
  await page.getByRole("button", { name: /Approve for the patient/ }).click();
  await page.getByRole("button", { name: "Send to patient" }).click();

  const link = page.getByRole("link", { name: "Open the patient view" });
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  if (href === null) throw new Error("patient link not found after send");
  return href;
}

test("critical result: approve, DOB gate rejects then accepts, patient reads and asks", async ({
  page,
}) => {
  await signIn(page);
  const patientLink = await walkReportToSent(page, "David Chen");

  await page.goto(patientLink);
  await expect(page.getByRole("heading", { name: /shared your lab results/ })).toBeVisible();

  // Wrong date of birth is rejected.
  await page.getByLabel("Month").fill("1");
  await page.getByLabel("Day").fill("1");
  await page.getByLabel("Year").fill("1990");
  await page.getByRole("button", { name: "View my results" }).click();
  await expect(page.getByText(/did not match/)).toBeVisible();

  // Correct date of birth (1971-11-02) opens the results.
  await page.getByLabel("Month").fill("11");
  await page.getByLabel("Day").fill("2");
  await page.getByLabel("Year").fill("1971");
  await page.getByRole("button", { name: "View my results" }).click();

  await expect(page.getByRole("heading", { name: /here are your results/ })).toBeVisible();
  await expect(page.getByText("Needs prompt attention").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Potassium" })).toBeVisible();
  await expect(page.getByText(/not medical advice/)).toBeVisible();

  // Ask a question.
  await page.getByRole("link", { name: /Message Dr\. Anderson/ }).click();
  await expect(page.getByRole("heading", { name: /Ask Dr\. Anderson/ })).toBeVisible();
  await page.getByRole("textbox").fill("Should I change anything about my diet?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByText(/question was sent/)).toBeVisible();
});

test("patient sees implausible, not-covered, and low states", async ({ page }) => {
  await signIn(page);
  const patientLink = await walkReportToSent(page, "Grace Okoro");

  await page.goto(patientLink);
  await page.getByLabel("Month").fill("7");
  await page.getByLabel("Day").fill("25");
  await page.getByLabel("Year").fill("1990");
  await page.getByRole("button", { name: "View my results" }).click();

  await expect(page.getByRole("heading", { name: /here are your results/ })).toBeVisible();
  await expect(page.getByText("Please double-check").first()).toBeVisible();
  await expect(page.getByText("Not covered yet").first()).toBeVisible();
  await expect(page.getByText("A little low").first()).toBeVisible();
});
