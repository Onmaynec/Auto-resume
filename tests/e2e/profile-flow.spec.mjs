import { expect, test } from '@playwright/test';
import { installApiMocks, loadProfile } from './support.mjs';

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test('profile to tailored resume exports DOCX, Markdown and PDF', async ({ page }) => {
  await page.goto('/');
  await loadProfile(page);

  await expect(page.locator('#profileCard h2')).toHaveText('Octo Cat');
  await expect(page.locator('#repos .repo')).toHaveCount(3);

  await page.locator('#vacancyText').fill(
    'We need a JavaScript and TypeScript developer with accessibility, PWA, serverless, testing and design system experience.',
  );
  await page.locator('#analyzeVacancyBtn').click();
  await expect(page.locator('#vacancyResult')).toBeVisible();
  await expect(page.locator('#vacancyResult')).toContainText('%');

  await page.locator('#generateBtn').click();
  await expect(page.locator('#resumeSection')).toBeVisible();
  await expect(page.locator('#resume [data-draft-field="name"]')).toHaveText('Octo Cat');
  await expect(page.locator('#draftList .draft-item')).toHaveCount(1);

  const markdownDownload = page.waitForEvent('download');
  await page.locator('#markdownBtn').click();
  await expect((await markdownDownload).suggestedFilename()).toMatch(/octocat-resume-ru\.md$/);

  const docxDownload = page.waitForEvent('download');
  await page.locator('#docxBtn').click();
  await expect((await docxDownload).suggestedFilename()).toMatch(/octocat-resume-ru\.docx$/);

  await page.locator('#visualPdfBtn').click();
  await expect.poll(() => page.evaluate(() => window.__autoResumePdfSaved || '')).toMatch(/octocat-visual-resume-ru\.pdf$/);

  await page.evaluate(() => {
    window.print = () => { window.__autoResumePrinted = true; };
  });
  await page.locator('[data-template-button="ats"]').click();
  await expect(page.locator('#atsPdfBtn')).toBeVisible();
  await page.locator('#atsPdfBtn').click();
  await expect.poll(() => page.evaluate(() => Boolean(window.__autoResumePrinted))).toBe(true);
});

test('comparison and public resume link preserve a read-only draft', async ({ page }) => {
  await page.goto('/');
  await loadProfile(page);

  await page.locator('#compareUsername').fill('hubot');
  await page.locator('#compareBtn').click();
  await expect(page.locator('#compareResult')).toBeVisible();
  await expect(page.locator('#compareResult')).toContainText('@hubot');

  await page.locator('#generateBtn').click();
  await page.locator('[data-template-button="ats"]').click();
  await page.locator('#shareBtn').click();

  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('#resume=');
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  const sharedHash = new URL(sharedUrl).hash;
  expect(sharedHash).toMatch(/^#resume=.+/);

  await page.goto(`/?e2e=shared${sharedHash}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toHaveClass(/shared-view/);
  await expect(page.locator('#sharedBanner')).toBeVisible();
  await expect(page.locator('#resumeSection')).toBeVisible();
  await expect(page.locator('#resume')).toHaveAttribute('data-template', 'ats');
  await expect(page.locator('#resume [contenteditable="true"]')).toHaveCount(0);
});

test('installed app shell reloads while offline', async ({ context, page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) throw new Error('Service workers are unavailable');
    await navigator.serviceWorker.ready;
  });

  try {
    await context.setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/Auto Resume/);
    await expect(page.locator('#networkStatus')).toContainText(/Офлайн|Offline/i);
  } finally {
    await context.setOffline(false);
  }
});
