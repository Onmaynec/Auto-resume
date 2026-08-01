import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { installApiMocks, loadProfile } from './support.mjs';

function importantViolations(results) {
  return results.violations
    .filter((violation) => ['critical', 'serious'].includes(violation.impact))
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.flatMap((node) => node.target),
    }));
}

async function audit(page, include = 'body') {
  const results = await new AxeBuilder({ page })
    .include(include)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .disableRules(['color-contrast'])
    .analyze();
  expect(importantViolations(results), JSON.stringify(importantViolations(results), null, 2)).toEqual([]);
}

test('landing page has no serious automated accessibility violations', async ({ page }) => {
  await installApiMocks(page);
  await page.goto('/');
  await audit(page);
});

test('profile dashboard and resume editor pass the automated audit', async ({ page }) => {
  await installApiMocks(page);
  await page.goto('/');
  await loadProfile(page);
  await page.locator('#generateBtn').click();
  await expect(page.locator('#resumeSection')).toBeVisible();
  await audit(page, '#mainContent');
});

test('OAuth consent dialog remains keyboard and screen-reader friendly', async ({ page }) => {
  await installApiMocks(page, {
    authState: { configured: true, authenticated: false, user: null, scopes: [], capabilities: {} },
  });
  await page.goto('/');
  await page.locator('#authControl [data-auth-action="consent"]').click();
  await expect(page.locator('#authConsentDialog')).toBeVisible();
  await audit(page, '#authConsentDialog');
});
