import { expect, test } from '@playwright/test';
import { installApiMocks, loadProfile } from './support.mjs';

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
});

test('interview prep links to a local application and stays outside public links', async ({ page }) => {
  await page.goto('/');
  await loadProfile(page);

  await page.locator('#vacancyText').fill('SECRET VACANCY SOURCE. We need JavaScript, TypeScript, accessibility, PWA, testing and Kubernetes experience for a frontend role.');
  await page.locator('#analyzeVacancyBtn').click();
  await page.locator('#generateBtn').click();

  await expect(page.locator('#applicationTrackerPanel')).toBeVisible();
  await expect(page.locator('#interviewPrepPanel')).toBeVisible();

  const tracker = page.locator('#applicationTrackerForm');
  await tracker.locator('[name="company"]').fill('Acme');
  await tracker.locator('[name="role"]').fill('Frontend Engineer');
  await tracker.locator('[name="status"]').selectOption('interview');
  await tracker.locator('[name="notes"]').fill('Prepare architecture and accessibility examples.');
  await tracker.locator('button[type="submit"]').click();
  await expect(page.locator('#applicationTrackerList .application-tracker__card')).toHaveCount(1);

  const prep = page.locator('#interviewPrepForm');
  await prep.locator('[name="applicationId"]').selectOption({ label: 'Acme — Frontend Engineer' });
  await expect(prep.locator('[name="company"]')).toHaveValue('Acme');
  await expect(prep.locator('[name="role"]')).toHaveValue('Frontend Engineer');
  await prep.locator('[name="interviewDate"]').fill('2026-08-12');
  await prep.locator('[name="skills"]').fill('JavaScript, Accessibility');
  await prep.locator('[name="gaps"]').fill('Kubernetes');
  await prep.locator('button[type="submit"]').click();

  await expect(page.locator('#interviewPrepSessions .interview-prep__session')).toHaveCount(1);
  expect(await page.locator('#interviewPrepDetail .interview-prep__question').count()).toBeGreaterThan(8);

  const firstQuestion = page.locator('#interviewPrepDetail .interview-prep__question').first();
  await firstQuestion.locator('textarea').fill('I would connect the role to a shipped project, explain the constraints, compare alternatives and quantify the result.');
  await firstQuestion.locator('select').selectOption('4');
  await firstQuestion.locator('input[type="checkbox"]').check();

  const star = page.locator('[data-star-form]');
  await star.locator('[name="title"]').fill('Accessible migration');
  await star.locator('[name="situation"]').fill('A legacy interface blocked keyboard users and slowed releases.');
  await star.locator('[name="task"]').fill('Improve accessibility without interrupting the product roadmap.');
  await star.locator('[name="action"]').fill('I introduced contract tests, staged components and accessibility checks.');
  await star.locator('[name="result"]').fill('The team reduced regressions and shipped the migration on schedule.');
  await star.locator('button[type="submit"]').click();
  await expect(page.locator('.interview-prep__story')).toHaveCount(1);
  await expect(page.locator('.interview-prep__detail-head > strong')).not.toHaveText('0/100');

  const markdownDownload = page.waitForEvent('download');
  await page.locator('[data-prep-export="md"]').click();
  await expect((await markdownDownload).suggestedFilename()).toMatch(/acme-frontend-engineer-interview-prep\.md$/);

  const jsonDownload = page.waitForEvent('download');
  await page.locator('[data-prep-export="json"]').click();
  await expect((await jsonDownload).suggestedFilename()).toMatch(/acme-frontend-engineer-interview-prep\.json$/);

  const stored = await page.evaluate(() => localStorage.getItem('auto-resume:interview-prep:v1') || '');
  expect(stored).toContain('Frontend Engineer');
  expect(stored).toContain('Kubernetes');
  expect(stored).not.toContain('SECRET VACANCY SOURCE');
  expect(stored).not.toContain('vacancyText');
  expect(stored).not.toContain('resumeDraft');

  await page.locator('#shareBtn').click();
  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  const sharedHash = new URL(sharedUrl).hash;
  await page.goto(`/?e2e=shared${sharedHash}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toHaveClass(/shared-view/);
  await expect(page.locator('#interviewPrepPanel')).toHaveCount(0);
});
