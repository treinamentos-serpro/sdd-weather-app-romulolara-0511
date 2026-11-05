import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.goto('/');
});

test('exibe cinco dias e alterna a unidade em todas as temperaturas', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
  await expect(page.getByText(/Não use como previsão real/)).toBeVisible();
  const dates = await page
    .locator('article time')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('datetime')));
  await page.getByRole('button', { name: 'Fahrenheit' }).click();
  await expect(page.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('main').getByText(/°C/)).toHaveCount(0);
  await expect(page.locator('main').getByText(/°F/)).toHaveCount(11);
  expect(
    await page
      .locator('article time')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('datetime'))),
  ).toEqual(dates);
});

test('busca uma cidade, seleciona o resultado e comunica ausência', async ({ page }) => {
  await page.getByRole('searchbox').fill('Lisboa');
  await page.getByRole('button', { name: 'Buscar cidade' }).click();
  await page.getByRole('button', { name: 'Lisboa Lisboa, Portugal' }).click();
  await expect(page.getByRole('heading', { name: 'Lisboa' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
  await page.getByRole('searchbox').fill('Atlantida');
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByRole('status')).toContainText('Nenhuma cidade encontrada');
  await expect(page.getByRole('article')).toHaveCount(0);
});

test('mantém controles utilizáveis e grid responsivo entre 320 e 1280 pixels', async ({ page }) => {
  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('searchbox')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buscar cidade' })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
    const cards = await page.getByRole('article').all();
    const boxes = await Promise.all(cards.map((card) => card.boundingBox()));
    const firstRow = boxes.filter((box) => box?.y === boxes[0]?.y);
    expect(firstRow).toHaveLength(width < 640 ? 2 : width < 1024 ? 3 : 5);
    const elements = page.locator('header, main, article, input, button, h1, h2, h3, dd');
    for (const element of await elements.all()) {
      const box = await element.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
    }
    for (const button of await page.getByRole('button').all()) {
      const box = await button.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  }
});
