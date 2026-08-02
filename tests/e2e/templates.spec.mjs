import { expect, test } from '@playwright/test';
import { installApiMocks, loadProfile } from './support.mjs';

const pixelPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

test.beforeEach(async ({ page }) => {
  await installApiMocks(page);
  await page.goto('/');
  await loadProfile(page);
  await page.locator('#generateBtn').click();
  await expect(page.locator('#presentationControls')).toBeVisible();
});

test('three visual themes expose deterministic layout and branding controls', async ({ page }) => {
  const theme = page.locator('[data-presentation-control="template"]');
  const resume = page.locator('#resume');

  const fingerprints = [];
  for (const templateId of ['visual-classic', 'visual-studio', 'visual-minimal']) {
    await theme.selectOption(templateId);
    await expect(resume).toHaveAttribute('data-template', templateId);
    fingerprints.push(await resume.evaluate((element) => {
      const style = getComputedStyle(element);
      const header = element.querySelector('.resume-header');
      return {
        template: element.dataset.template,
        version: element.dataset.templateVersion,
        className: element.className,
        accent: style.getPropertyValue('--resume-accent').trim(),
        padding: style.getPropertyValue('--resume-pad').trim(),
        headerDisplay: header ? getComputedStyle(header).display : '',
      };
    }));
  }

  expect(fingerprints.map((item) => item.template)).toEqual(['visual-classic', 'visual-studio', 'visual-minimal']);
  expect(fingerprints.every((item) => item.version === '1')).toBe(true);
  expect(fingerprints.every((item) => item.className.includes(`template-${item.template}`))).toBe(true);
  expect(fingerprints.every((item) => item.headerDisplay === 'flex')).toBe(true);

  await page.locator('[data-presentation-control="font"]').selectOption('georgia');
  await page.locator('[data-presentation-control="density"]').selectOption('compact');
  await page.locator('[data-presentation-control="spacing"]').selectOption('tight');
  await page.locator('[data-presentation-control="accent"]').fill('#f5f5f5');
  await page.locator('[data-presentation-control="accent"]').dispatchEvent('change');

  await expect(resume).toHaveClass(/font-georgia/);
  await expect(resume).toHaveClass(/density-compact/);
  await expect(resume).toHaveClass(/spacing-tight/);
  await expect(page.locator('[data-presentation-contrast]')).toHaveAttribute('data-valid', 'false');

  await page.locator('[data-template-button="ats"]').click();
  await expect(resume).toHaveAttribute('data-template', 'ats-basic');
  await expect(page.locator('#presentationControls')).toHaveAttribute('aria-disabled', 'true');
  await expect(resume.locator('#skillsChart')).toHaveCount(0);

  await page.locator('[data-template-button="visual"]').click();
  await expect(resume).toHaveAttribute('data-template', 'visual-minimal');
});

test('custom logo stays local while template metadata survives the public link', async ({ page }) => {
  await page.locator('[data-presentation-control="template"]').selectOption('visual-studio');
  await page.locator('[data-presentation-control="accent"]').fill('#0f766e');
  await page.locator('[data-presentation-control="accent"]').dispatchEvent('change');
  await page.locator('#presentationLogoInput').setInputFiles({ name: 'brand.png', mimeType: 'image/png', buffer: pixelPng });

  await expect(page.locator('#resume [data-custom-logo="true"]')).toBeVisible();
  await expect(page.locator('[data-presentation-logo-status]')).toContainText('brand.png');

  await page.locator('#shareBtn').click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('#resume=');
  const payload = await page.evaluate(async () => {
    const sharedUrl = await navigator.clipboard.readText();
    const encoded = new URL(sharedUrl).hash.replace(/^#resume=/, '');
    const { decodeSharePayload } = await import('./js/share.mjs');
    return decodeSharePayload(encoded);
  });

  expect(payload.version).toBe(4);
  expect(payload.presentation.templateId).toBe('visual-studio');
  expect(payload.presentation.templateVersion).toBe(1);
  expect(JSON.stringify(payload)).not.toContain('blob:');
  expect(JSON.stringify(payload)).not.toContain('brand.png');
});
