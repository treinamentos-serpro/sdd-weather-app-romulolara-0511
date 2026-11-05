import { expect, type Route, test } from '@playwright/test';
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
  await expect(page.getByRole('button', { name: 'Celsius' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('region', { name: 'São Paulo' }).getByText(/24\s*°C/)).toBeVisible();
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
  await expect(page.getByRole('region', { name: 'São Paulo' }).getByText(/75\s*°F/)).toBeVisible();
  const expectedTemperatures = [
    [64, 79],
    [66, 82],
    [63, 73],
    [61, 72],
    [64, 81],
  ];
  for (const [index, temperatures] of expectedTemperatures.entries()) {
    for (const temperature of temperatures) {
      await expect(
        page
          .getByRole('article')
          .nth(index)
          .getByText(new RegExp(`${temperature}\\s*°F`)),
      ).toBeVisible();
    }
  }
  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  expect(
    await page
      .locator('article time')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('datetime'))),
  ).toEqual(dates);
  expect(forecasts).toBe(1);
});

test('distingue homônimas e consulta a localização escolhida usando apenas teclado', async ({
  page,
}) => {
  const selected = mockWeather[2];
  const homonym = { ...initialMockWeather.city, name: selected.city.name };
  await page.route('https://geocoding-api.open-meteo.com/v1/search?**', (route) =>
    route.fulfill({ json: geocodingResponse([homonym, selected.city]) }),
  );
  await page.getByRole('searchbox').focus();
  await page.keyboard.type('Lisboa');
  await page.keyboard.press('Enter');
  const brazil = page.getByRole('button', { name: 'Lisboa São Paulo, Brasil' });
  const portugal = page.getByRole('button', { name: 'Lisboa Lisboa, Portugal' });
  await expect(brazil).toBeVisible();
  await expect(portugal).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Buscar cidade' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(brazil).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(portugal).toBeFocused();

  const forecastRequest = page.waitForRequest('https://api.open-meteo.com/v1/forecast?**');
  await page.keyboard.press('Enter');
  const url = new URL((await forecastRequest).url());
  expect(url.searchParams.get('latitude')).toBe(String(selected.city.latitude));
  expect(url.searchParams.get('longitude')).toBe(String(selected.city.longitude));
  const current = page.getByRole('region', { name: 'Lisboa' });
  await expect(current.getByText('Lisboa, Portugal')).toBeVisible();
  await expect(current.getByText(/17\s*°C/)).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(5);
});

test('mantém loading em consultas lentas e aplica a unidade escolhida antes da resposta', async ({
  page,
}) => {
  let captureSearch!: (route: Route) => void;
  let captureForecast!: (route: Route) => void;
  const pendingSearch = new Promise<Route>((resolve) => {
    captureSearch = resolve;
  });
  const pendingForecast = new Promise<Route>((resolve) => {
    captureForecast = resolve;
  });
  await page.route('https://geocoding-api.open-meteo.com/v1/search?**', captureSearch);
  await page.route('https://api.open-meteo.com/v1/forecast?**', captureForecast);
  await page.getByRole('searchbox').fill('São Paulo');
  await page.getByRole('searchbox').press('Enter');
  await expect(page.getByRole('status')).toContainText('Buscando cidades...');
  await expect(page.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('article')).toHaveCount(0);
  await (await pendingSearch).fulfill({ json: geocodingResponse([initialMockWeather.city]) });
  await page.getByRole('button', { name: /São Paulo.*Brasil/ }).click();
  await expect(page.getByRole('status')).toContainText('Carregando o clima de São Paulo...');
  await page.getByRole('button', { name: 'Fahrenheit' }).click();
  await expect(page.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(0);
  await (await pendingForecast).fulfill({ json: forecastResponse(initialMockWeather) });
  await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(page.getByRole('main').getByText(/°C/)).toHaveCount(0);
  await expect(page.getByRole('main').getByText(/°F/)).toHaveCount(11);
});

for (const invalid of ['clima ausente', 'previsão incompleta', 'JSON malformado'] as const) {
  test(`comunica ${invalid} como falha e permite recuperar a mesma cidade`, async ({ page }) => {
    let attempts = 0;
    const coordinates: string[][] = [];
    await page.route('https://api.open-meteo.com/v1/forecast?**', (route) => {
      attempts++;
      const params = new URL(route.request().url()).searchParams;
      coordinates.push([params.get('latitude') ?? '', params.get('longitude') ?? '']);
      const body = forecastResponse(initialMockWeather);
      if (attempts > 1) return route.fulfill({ json: body });
      if (invalid === 'JSON malformado') {
        return route.fulfill({ contentType: 'application/json', body: '{' });
      }
      return route.fulfill({
        json:
          invalid === 'clima ausente'
            ? { ...body, current: null }
            : { ...body, daily: { ...body.daily, temperature_2m_max: [26, 28] } },
      });
    });
    await page.getByRole('searchbox').fill('São Paulo');
    await page.getByRole('searchbox').press('Enter');
    await page.getByRole('button', { name: /São Paulo.*Brasil/ }).click();
    await expect(page.getByRole('alert')).toContainText(
      'Não foi possível consultar o clima de São Paulo',
    );
    await expect(page.getByRole('article')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'São Paulo' })).toHaveCount(0);
    await expect(page.getByText('Nenhuma cidade encontrada')).toHaveCount(0);
    await page.getByRole('button', { name: 'Tentar novamente' }).click();
    await expect(page.getByRole('heading', { name: 'São Paulo' })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(5);
    expect(coordinates).toEqual([
      [String(initialMockWeather.city.latitude), String(initialMockWeather.city.longitude)],
      [String(initialMockWeather.city.latitude), String(initialMockWeather.city.longitude)],
    ]);
  });
}

test('preserva os cinco dias locais na virada do ano em outro fuso horário', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-12-29T10:15:00Z'));
  const dates = ['2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03'];
  const body = forecastResponse(initialMockWeather);
  body.timezone = 'Pacific/Kiritimati';
  body.current.time = '2026-12-30T00:15';
  body.daily.time = dates;
  await page.route('https://api.open-meteo.com/v1/forecast?**', (route) =>
    route.fulfill({ json: body }),
  );
  await page.getByRole('searchbox').fill('São Paulo');
  await page.getByRole('searchbox').press('Enter');
  await page.getByRole('button', { name: /São Paulo.*Brasil/ }).click();
  await expect(page.getByRole('article')).toHaveCount(5);
  for (const [index, date] of dates.entries()) {
    const time = page.getByRole('article').nth(index).locator('time');
    await expect(time).toHaveAttribute('datetime', date);
    await expect(time).toContainText(`${date.slice(8)}/${date.slice(5, 7)}`);
  }
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
