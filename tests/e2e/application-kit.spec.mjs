import { expect, test } from '@playwright/test';
import { installApiMocks, loadProfile } from './support.mjs';

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test('vacancy analysis creates an editable local application kit with exports', async ({ page }) => {
  const requests = [];
  page.on('request', (request) => requests.push({ url: request.url(), body: request.postData() || '' }));
  await page.goto('/');
  await loadProfile(page);

  const secret = 'CONFIDENTIAL-VACANCY-7f9c';
  await page.locator('#vacancyText').fill(
    `${secret} We need a JavaScript and TypeScript developer with Kubernetes, accessibility, PWA, serverless and testing experience.`,
  );
  await page.locator('#analyzeVacancyBtn').click();

  const panel = page.locator('#applicationKitPanel');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('data-application-kit-ready', 'true');
  const editor = page.locator('#applicationKitEditor');
  await expect(editor).toHaveValue(/Octo Cat/);
  await expect(editor).toHaveValue(/JavaScript/);
  await expect(editor).toHaveValue(/Kubernetes/);
  await expect(editor).not.toHaveValue(new RegExp(secret));

  await page.locator('#applicationKitTone').selectOption('detailed');
  await expect(editor).toHaveValue(/Пакет отклика/);
  await editor.fill(`${await editor.inputValue()}\n\nПользовательская заметка.`);
  await page.locator('#applicationKitCopy').click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Пользовательская заметка');

  const markdownDownload = page.waitForEvent('download');
  await page.locator('#applicationKitMarkdown').click();
  await expect((await markdownDownload).suggestedFilename()).toBe('octocat-application-kit-ru.md');

  const textDownload = page.waitForEvent('download');
  await page.locator('#applicationKitText').click();
  await expect((await textDownload).suggestedFilename()).toBe('octocat-application-kit-ru.txt');

  const storage = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(storage).not.toContain(secret);
  expect(requests.every((request) => !`${request.url}\n${request.body}`.includes(secret))).toBe(true);

  await page.locator('#localeSelect').selectOption('en');
  await page.locator('#applicationKitRegenerate').click();
  await expect(editor).toHaveValue(/Application Kit/);
  await expect(editor).toHaveValue(/I do not present [^.]*Kubernetes[^.]* as existing experience/);

  await page.locator('#clearVacancyBtn').click();
  await expect(panel).toBeHidden();
});
