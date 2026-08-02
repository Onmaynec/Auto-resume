import { expect, test } from '@playwright/test';
import { installApiMocks, loadProfile } from './support.mjs';

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test('resume audit recalculates locally and stays outside public links', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push(`${request.url()}\n${request.postData() || ''}`));

  await page.goto('/');
  await loadProfile(page);

  const secret = 'CONFIDENTIAL-AUDIT-VACANCY-36';
  await page.locator('#vacancyText').fill(
    `${secret} We need a TypeScript and JavaScript developer with accessibility, testing, Kubernetes and measurable delivery outcomes.`,
  );
  await page.locator('#analyzeVacancyBtn').click();
  await page.locator('#generateBtn').click();

  const panel = page.locator('#resumeAuditPanel');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('data-resume-audit-ready', 'true');
  await expect(panel.locator('#resumeAuditTitle')).toContainText('Качество резюме');

  const initialScore = Number(await panel.getAttribute('data-audit-score'));
  expect(initialScore).toBeGreaterThanOrEqual(0);
  expect(initialScore).toBeLessThanOrEqual(100);

  await page.locator('#resume [data-draft-field="about"]').fill('Слишком коротко.');
  await expect(panel.locator('[data-issue-code="SUMMARY_LENGTH"]')).toBeVisible();
  const reducedScore = Number(await panel.getAttribute('data-audit-score'));
  expect(reducedScore).toBeLessThan(initialScore);

  await panel.locator('[data-audit-action="copy"]').click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Аудит качества резюме');
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('SUMMARY_LENGTH');

  const markdownDownload = page.waitForEvent('download');
  await panel.locator('[data-audit-action="markdown"]').click();
  await expect((await markdownDownload).suggestedFilename()).toBe('octocat-resume-audit-ru.md');

  const textDownload = page.waitForEvent('download');
  await panel.locator('[data-audit-action="text"]').click();
  await expect((await textDownload).suggestedFilename()).toBe('octocat-resume-audit-ru.txt');

  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(storage).not.toContain(secret);
  expect(storage).not.toContain('resumeAudit');
  expect(requests.every((request) => !request.includes(secret))).toBe(true);

  await page.locator('#localeSelect').selectOption('en');
  await expect(panel.locator('#resumeAuditTitle')).toContainText('Resume quality');
  await expect(panel).toHaveAttribute('data-audit-grade', /strong|good|needsWork|weak/);

  await page.locator('#shareBtn').click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('#resume=');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).not.toContain(secret);
  expect(copied).not.toContain('resumeAudit');

  const sharedHash = new URL(copied).hash;
  await page.goto(`/?e2e=audit-shared${sharedHash}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toHaveClass(/shared-view/);
  await expect(page.locator('#resumeAuditPanel')).toHaveCount(0);
});
