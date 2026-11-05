import { expect, test } from '@playwright/test';
import { forecastResponse, geocodingResponse } from '../fixtures/openMeteo';
import { initialMockWeather, mockWeather } from '../fixtures/weather';

test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
  await page.route('https://geocoding-api.open-meteo.com/v1/search?**', (route) => {
    const query = new URL(route.request().url()).searchParams.get('name');
    const cities = mockWeather.filter(({ city }) => city.name === query).map(({ city }) => city);
    return route.fulfill({ json: geocodingResponse(cities) });
  });
  await page.route('https://api.open-meteo.com/v1/forecast?**', (route) => {
    const latitude = new URL(route.request().url()).searchParams.get('latitude');
    const weather = mockWeather.find(({ city }) => String(city.latitude) === latitude);
    if (!weather) throw new Error(`Coordenadas inesperadas: ${route.request().url()}`);
    return route.fulfill({ json: forecastResponse(weather) });
  });
  await page.goto('/');
});

test('exibe cinco dias e alterna a unidade em todas as temperaturas', async ({ page }) => {
  let forecasts = 0;
  page.on('request', (request) => {
    if (request.url().startsWith('https://api.open-meteo.com/')) forecasts++;
  });
  await expect(page.getByRole('status')).toContainText('Qual cidade vamos explorar?');
  await page.getByRole('searchbox').fill('São Paulo');
  await page.getByRole('searchbox').press('Enter');
  await page.getByRole('button', { name: /São Paulo.*Brasil/ }).click();
  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
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
  expect(forecasts).toBe(1);
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
  await page.getByRole('searchbox').fill('São Paulo');
  await page.getByRole('searchbox').press('Enter');
  await page.getByRole('button', { name: /São Paulo.*Brasil/ }).click();
  await expect(page.getByRole('article')).toHaveCount(5);
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

test('comunica falha da previsão e repete a consulta da cidade selecionada', async ({ page }) => {
  let attempts = 0;
  await page.route('https://api.open-meteo.com/v1/forecast?**', (route) => {
    attempts++;
    return attempts === 1
      ? route.fulfill({ status: 503, body: 'indisponível' })
      : route.fulfill({ json: forecastResponse(initialMockWeather) });
  });
  await page.getByRole('searchbox').fill('São Paulo');
  await page.getByRole('searchbox').press('Enter');
  await page.getByRole('button', { name: /São Paulo.*Brasil/ }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Não foi possível consultar o clima de São Paulo',
  );
  await expect(page.getByRole('article')).toHaveCount(0);
  await page.getByRole('button', { name: 'Fahrenheit' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(page.locator('main').getByText(/°F/)).toHaveCount(11);
  expect(attempts).toBe(2);
});

test('falha da busca não é resultado vazio e pode ser repetida', async ({ page }) => {
  let attempts = 0;
  await page.route('https://geocoding-api.open-meteo.com/v1/search?**', (route) => {
    attempts++;
    return attempts === 1
      ? route.abort('failed')
      : route.fulfill({ json: geocodingResponse([initialMockWeather.city]) });
  });
  await page.getByRole('searchbox').fill('São Paulo');
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByRole('alert')).toContainText('Não foi possível buscar cidades');
  await expect(page.getByText('Nenhuma cidade encontrada')).toHaveCount(0);
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('button', { name: /São Paulo.*Brasil/ })).toBeVisible();
  expect(attempts).toBe(2);
});
