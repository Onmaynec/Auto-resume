import { expect, test } from '@playwright/test';
import { installApiMocks, loadProfile } from './support.mjs';

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test('application tracker manages a local pipeline and stays outside public links', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push(`${request.url()}\n${request.postData() || ''}`));
  await page.goto('/');
  await expect(page.locator('#applicationTrackerPanel')).toBeVisible();

  await loadProfile(page);
  const vacancySecret = 'PRIVATE-VACANCY-TRACKER-8d2a';
  await page.locator('#vacancyText').fill(
    `${vacancySecret} We need a JavaScript developer with TypeScript, accessibility, testing and PWA experience.`,
  );
  await page.locator('#analyzeVacancyBtn').click();
  await page.locator('#generateBtn').click();
  await expect(page.locator('#draftList .draft-item')).toHaveCount(1);
  await expect(page.locator('#applicationTrackerForm select[name="draftId"] option')).toHaveCount(2);

  const companySecret = 'Acme Confidential 7f3b';
  const form = page.locator('#applicationTrackerForm');
  await form.locator('input[name="company"]').fill(companySecret);
  await form.locator('input[name="role"]').fill('Senior Frontend Developer');
  await form.locator('input[name="vacancyUrl"]').fill('https://jobs.example.com/frontend');
  await form.locator('select[name="status"]').selectOption('applied');
  await form.locator('input[name="appliedDate"]').fill('2026-08-01');
  await form.locator('input[name="followUpDate"]').fill('2026-08-01');
  await form.locator('select[name="draftId"]').selectOption({ index: 1 });
  await form.locator('textarea[name="notes"]').fill('Follow up with the recruiter and send the portfolio.');
  await form.locator('button[type="submit"]').click();

  const card = page.locator('#applicationTrackerList [data-application-id]');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText(companySecret);
  await expect(card).toHaveAttribute('data-follow-up-state', 'overdue');
  await expect(page.locator('#applicationTrackerStats')).toContainText('1');

  await card.locator('[data-tracker-status-id]').selectOption('interview');
  await expect(card.locator('[data-tracker-status-id]')).toHaveValue('interview');

  await page.locator('#applicationTrackerSearch').fill('Acme Confidential');
  await expect(card).toHaveCount(1);
  await page.locator('#applicationTrackerSearch').fill('No match');
  await expect(page.locator('#applicationTrackerList')).toContainText(/ничего|No applications/i);
  await page.locator('#applicationTrackerSearch').fill('');

  const csvDownload = page.waitForEvent('download');
  await page.locator('[data-tracker-export="csv"]').click();
  await expect((await csvDownload).suggestedFilename()).toMatch(/^applications-\d{4}-\d{2}-\d{2}\.csv$/);

  const jsonDownload = page.waitForEvent('download');
  await page.locator('[data-tracker-export="json"]').click();
  await expect((await jsonDownload).suggestedFilename()).toMatch(/^applications-\d{4}-\d{2}-\d{2}\.json$/);

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('auto-resume:application-tracker:v1')));
  expect(stored.version).toBe(1);
  expect(stored.records).toHaveLength(1);
  expect(stored.records[0].company).toBe(companySecret);
  expect(stored.records[0].draft).toEqual(expect.objectContaining({ id: expect.any(String), name: expect.any(String) }));
  expect(JSON.stringify(stored)).not.toContain(vacancySecret);
  expect(JSON.stringify(stored)).not.toContain('Full-stack developer building accessible web applications');
  expect(requests.every((request) => !request.includes(companySecret) && !request.includes(vacancySecret))).toBe(true);

  await page.locator('#shareBtn').click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  const sharedHash = new URL(sharedUrl).hash;
  expect(sharedUrl).not.toContain(companySecret);
  await page.goto(`/?e2e=tracker-shared${sharedHash}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toHaveClass(/shared-view/);
  await expect(page.locator('#applicationTrackerPanel')).toHaveCount(0);
  await expect(page.locator('#resumeSection')).toBeVisible();
});
