import { expect, test } from '@playwright/test';
import { authenticatedState, installApiMocks } from './support.mjs';

for (const scenario of [
  { query: '?auth=denied', kind: 'warning' },
  { query: '?auth=error&reason=invalid_state', kind: 'error' },
]) {
  test(`OAuth callback ${scenario.query} is reported without leaking query data`, async ({ page }) => {
    await installApiMocks(page, {
      authState: { configured: true, authenticated: false, user: null, scopes: [], capabilities: {} },
    });
    await page.goto(`/${scenario.query}`);

    await expect(page.locator('#status')).toBeVisible();
    await expect(page.locator('#status')).toHaveClass(new RegExp(scenario.kind));
    await expect(page).not.toHaveURL(/auth=|reason=/);
  });
}

test('authenticated session exposes self analysis and logs out cleanly', async ({ page }) => {
  const mocks = await installApiMocks(page, { authState: authenticatedState() });
  await page.goto('/?auth=success');

  await expect(page.locator('#authControl .auth-summary')).toContainText('octocat');
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('auto-resume:auth-login'))).toBe('octocat');

  await page.locator('#authControl .auth-summary').click();
  await page.locator('[data-auth-action="analyze"]').click();
  await expect(page.locator('#username')).toHaveValue('octocat');
  await expect(page.locator('#dashboard')).toBeVisible();

  await page.locator('#authControl .auth-summary').click();
  await page.locator('[data-auth-action="logout"]').click();
  await expect(page.locator('#authControl [data-auth-action="consent"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('auto-resume:auth-login'))).toBeNull();
  expect(mocks.getAuthState().authenticated).toBe(false);
});

test('expired server session returns to configured guest mode', async ({ page }) => {
  await installApiMocks(page, {
    authState: { configured: true, authenticated: false, user: null, scopes: [], capabilities: {} },
  });
  await page.goto('/');

  const signIn = page.locator('#authControl [data-auth-action="consent"]');
  await expect(signIn).toBeVisible();
  await expect(signIn).toBeEnabled();
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('auto-resume:auth-login'))).toBeNull();
});
