# Plano Técnico — Aplicação de Previsão do Tempo

Fonte da verdade: [especificação do produto](../specs/weather-app-spec.md).
Este documento define arquitetura e contratos para orientar a etapa de Tasks; não
descreve a implementação final.

## 1. Architecture Overview

Aplicação SPA em React, organizada em camadas e com fluxo unidirecional:

```text
Pessoa usuária
  └── App e componentes de apresentação
        └── hook useWeather (estado e orquestração)
              └── weatherService (HTTP e validação das respostas)
                    └── Open-Meteo Geocoding e Forecast

lib/
  └── conversão de temperatura, formatação de datas e códigos meteorológicos
types/
  └── contratos normalizados compartilhados
```

- **Apresentação (`components/`)**: busca de cidade, seleção de unidade, clima
  atual, previsão diária e estados visuais. Os componentes recebem dados e
  callbacks por props; não fazem chamadas de rede.
- **Orquestração (`hooks/`)**: `useWeather` coordena busca, seleção, consulta,
  repetição e estado da tela.
- **Dados (`services/`)**: `weatherService` encapsula URLs, parâmetros, parsing
  e erros da Open-Meteo; converte a resposta externa para os tipos internos.
- **Funções puras (`lib/`)**: conversão de unidade, formatação localizada e
  mapeamento de códigos meteorológicos.
- **Contratos (`types/`)**: modelos independentes dos formatos da API.

O fluxo e as decisões atendem RF1–RF7, RNF1–RNF6 e às histórias US1–US5.

## 2. Tech Stack

| Camada | Tecnologia | Justificativa e relação com a spec |
| --- | --- | --- |
| Linguagem | TypeScript strict | Contratos explícitos entre API, estado e UI; ajuda a prevenir dados incompletos (RF3–RF5, RNF5). |
| UI e build | React + Vite | SPA simples, compatível com a estrutura do projeto. |
| Estilos | Tailwind CSS | Implementação responsiva mobile-first e tema dark glassmorphism (RNF1). |
| Dados | Open-Meteo Geocoding e Forecast | Geocodificação e previsão sem chave de API, conforme a premissa da spec. |
| Testes unitários | Vitest + Testing Library | Testes de funções, serviços, hooks e comportamento acessível da UI. |
| Testes E2E | Playwright | Validação do fluxo completo e de viewport móvel. |
| Qualidade | Biome | Lint e formatação conforme configuração do repositório. |
| Gerenciador | pnpm | Gerenciador de pacotes adotado pelo projeto. |

Não adicionar biblioteca de estado ou cliente HTTP: o estado local do React e
`fetch` são suficientes para o escopo da primeira versão.

## 3. Project Structure

Manter a estrutura existente e criar os módulos abaixo conforme a decomposição
das tarefas:

```text
src/
├── components/
│   ├── SearchBar.tsx
│   ├── CityResults.tsx
│   ├── CurrentWeather.tsx
│   ├── ForecastList.tsx
│   ├── ForecastDayCard.tsx
│   ├── UnitToggle.tsx
│   └── states/
│       ├── LoadingState.tsx
│       ├── ErrorState.tsx
│       └── EmptyState.tsx
├── hooks/
│   └── useWeather.ts
├── services/
│   └── weatherService.ts
├── lib/
│   ├── temperature.ts
│   ├── weatherCodes.ts
│   └── date.ts
├── types/
│   └── weather.ts
├── styles/
├── App.tsx
└── main.tsx
```

Cada componente React fica em seu próprio arquivo. `App.tsx` compõe a tela;
`main.tsx` inicializa a aplicação. A interface e mensagens são em pt-BR. Não
introduzir telas de autenticação, geolocalização automática ou persistência em
servidor, fora do escopo (seção 9 da spec).

## 4. Data Model

Tipos conceituais a definir em `src/types/weather.ts`. A previsão e o clima
normalizados usam Celsius internamente; somente a apresentação converte a
unidade.

```ts
export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface City {
  id: number;
  name: string;
  country: string;
  countryCode?: string;
  region?: string;
  latitude: number;
  longitude: number;
}

export interface CurrentWeather {
  temperatureC: number;
  weatherCode: number;
  time: string;
}

export interface ForecastDay {
  date: string;
  minTemperatureC: number;
  maxTemperatureC: number;
  weatherCode: number;
}

export interface WeatherData {
  city: City;
  timezone: string;
  current: CurrentWeather;
  forecast: ForecastDay[];
}
```

O conjunto acima é a proposta mínima para esta versão, não uma decisão já
aprovada sobre detalhes meteorológicos: a spec deixa campos adicionais em aberto
(questões 1–3). Se esses campos forem aprovados, atualizar os contratos, campos
solicitados à API e critérios/testes em conjunto. `forecast` deve conter
exatamente cinco dias locais — hoje e os quatro seguintes (RF4).

Estados da tela podem ser representados como união discriminada, evitando
combinações inválidas:

```ts
export type WeatherViewState =
  | { status: 'idle' }
  | { status: 'searching' }
  | { status: 'results'; cities: City[] }
  | { status: 'loading'; city: City }
  | { status: 'success'; data: WeatherData }
  | { status: 'error'; city?: City; message: string };
```

Lista vazia é o resultado `results` com `cities: []`, apresentado como busca sem
resultados (RF6); não equivale a uma cidade selecionada. Se forem necessárias
identidades distintas de erro para busca e previsão, detalhá-las ao decompor as
tarefas sem alterar esse comportamento.

## 5. Data Flow

1. A pessoa informa ou altera o texto da busca. Antes de chamar o serviço, a
   interface verifica o tamanho da entrada: com menos de três caracteres, não
   envia requisição e não apresenta isso como uma busca sem resultados. A partir
   de três caracteres, inicia a busca automaticamente, sem botão ou tecla de
   envio (RF1, US1). Aguarda 300 ms após a última edição antes de consultar;
   uma edição posterior cancela o temporizador e invalida a requisição ativa
   (RNF7).
2. `weatherService.searchCities(query)` consulta o Geocoding e normaliza os
   resultados. A UI comunica loading enquanto aguarda; resultado vazio exibe
   mensagem de ausência; cada opção mostra cidade e contexto geográfico (RF2,
   RF6, US1).
3. Ao escolher uma cidade, a aplicação guarda o objeto `City` selecionado e
   solicita clima usando suas coordenadas — nunca o texto de busca ou
   coordenadas de outra opção.
4. `weatherService.getWeather(city)` valida e normaliza clima atual e cinco dias.
   Enquanto aguarda, a UI apresenta loading; em sucesso, identifica os dados
   com a cidade e renderiza as condições e os cinco dias (RF3, RF4, RNF5).
5. O seletor de unidade atualiza `unit`, inicialmente Celsius. A UI deriva todos
   os valores Celsius ou Fahrenheit a partir do mesmo `WeatherData`, sem nova
   requisição e sem alterar cidade ou datas (RF5).
6. Falhas mantêm cidade para oferecer nova tentativa. Repetir usa as coordenadas
   da cidade selecionada (RF7).

O hook deve descartar ou cancelar respostas obsoletas de buscas/consultas
anteriores para que uma resposta lenta não substitua a cidade selecionada mais
recentemente. Ao alternar unidade durante loading ou erro, manter intacto o
estado de consulta (edge case da spec).

## 6. External APIs

### Geocoding

```text
GET https://geocoding-api.open-meteo.com/v1/search
  ?name={query}&count=5&language=pt&format=json
```

Só chamar o endpoint quando a entrada da busca tiver pelo menos três caracteres.
Essa validação ocorre antes da chamada HTTP; entradas menores não são submetidas
ao Geocoding nem tratadas como resultado vazio.

Parâmetros propostos: `name` é o texto pesquisado; `count=5` limita resultados;
`language=pt` solicita nomes/localizações em português quando disponíveis;
`format=json` torna explícito o formato esperado. Mapear `results[]` para
`City[]`, usando nome, país, região administrativa e coordenadas. Tratar
resposta sem `results` como lista vazia somente quando a resposta da API for
válida; erro HTTP ou JSON inválido é falha, não ausência de resultados.

### Forecast

```text
GET https://api.open-meteo.com/v1/forecast
  ?latitude={latitude}&longitude={longitude}
  &current=temperature_2m,weather_code
  &daily=weather_code,temperature_2m_max,temperature_2m_min
  &temperature_unit=celsius&forecast_days=5&timezone=auto
```

`timezone=auto` solicita os dias e horários na zona local das coordenadas,
necessário para a janela de hoje mais quatro dias (RF4, edge case de mudança de
dia). `temperature_unit=celsius` mantém o modelo normalizado estável; a
conversão Fahrenheit ocorre na apresentação.

As listas `daily` da API são arrays paralelos: validar presença, tipos e
comprimento antes de combiná-las por índice em `ForecastDay[]`. Validar também
os campos necessários de `current` e timezone. Resposta incompleta ou inválida
não pode ser apresentada como consulta concluída; propagar erro para o estado
de erro e permitir retry (RF7, edge cases). A seleção desses campos é a proposta
mínima; rever se as questões 1–3 aprovarem detalhes adicionais.

## 7. State Management

- Manter busca, resultados, cidade selecionada, dados do clima, estado da
  consulta e unidade no hook `useWeather` (ou estado local de `App` coordenado
  por esse hook). Não usar store global.
- Começar em `idle`, com Celsius e sem cidade/dados selecionados. Uma busca sem
  correspondências apresenta estado vazio sem inventar seleção.
- A busca é automática conforme o texto muda: só chamar `searchCities(query)`
  quando a entrada tiver no mínimo três caracteres. Abaixo desse limite, não
  iniciar loading nem representar a entrada curta como uma busca concluída sem
  resultados; limpar/invalidar resultados de consultas anteriores para que não
  pareçam corresponder ao texto atual.
- Expor operações conceituais `searchCities(query)`, `selectCity(city)`,
  `setUnit(unit)` e `retry()`, além do estado necessário à UI. Buscas
  automáticas aguardam 300 ms após a última edição (RNF7).
- Manter temperaturas em Celsius e derivar valores para exibição com funções
  puras. Conversão:
  `°F = (°C × 9 / 5) + 32`; formatar com unidade e locale `pt-BR`.
- Não persistir cidade ou unidade entre sessões na primeira versão: a spec
  confirma ausência de persistência no servidor, mas a persistência local está
  em aberto (questão 7). Reavaliar se for decidida.
- Evitar resposta fora de ordem: associar a cada operação uma identidade/cancelar
  requisição anterior para que apenas a consulta vigente atualize a UI.

## 8. Error Handling Strategy

- Separar vazio de erro: uma busca válida sem resultados exibe estado vazio; falha
  de rede, HTTP não bem-sucedido, timeout, JSON inválido ou dados meteorológicos
  incompletos produzem estado de erro (RF6, edge cases).
- Uma entrada com menos de três caracteres não inicia busca: não exibir loading,
  erro ou mensagem de “nenhum resultado” para esse caso. Ao reduzir a entrada
  abaixo do limite enquanto uma consulta está pendente, cancelar ou invalidar
  sua resposta para não mostrar resultados desatualizados.
- O serviço valida `response.ok`, parsing e campos necessários; erros devem
  carregar contexto suficiente para diagnóstico e ser propagados ao hook. A UI
  exibe mensagem pt-BR compreensível, sem detalhes técnicos da API.
- Durante busca e previsão, exibir loading perceptível e manter controles
  semanticamente nomeados e utilizáveis por teclado (RNF2–RNF4).
- O erro da previsão preserva a cidade selecionada e mostra ação “Tentar
  novamente”; repetir a consulta não exige uma nova busca (RF7).
- Usar `AbortController` para cancelar operações obsoletas. Cada chamada de rede
  expira após 10 segundos; expiração é um erro recuperável com retry, enquanto
  cancelamento intencional de consulta obsoleta não deve ser comunicado como
  falha (RNF4, RNF7).
- Anunciar loading e erro com regiões semânticas; não aplicar `aria-live` ao
  conteúdo completo da previsão. Animações devem respeitar movimento reduzido
  (RNF2, RNF8).
- Não exibir dados parciais como consulta concluída. Campos opcionais só podem
  ser omitidos se sua ausência for compatível com os detalhes aprovados; campos
  obrigatórios inválidos/incompletos resultam em erro e retry.

## 9. Testing Strategy

### Unitários — Vitest e Testing Library

- `temperature`: conversões Celsius/Fahrenheit, valores negativos e consistência
  da unidade exibida.
- `weatherCodes` e `date`: mapeamento/formatação e datas locais, incluindo
  sequência de cinco dias.
- `weatherService`: parâmetros e coordenadas corretos; mapeamento de resultados
  de geocoding e arrays diários; garantir que entradas com menos de três
  caracteres não gerem requisição, que o limite seja inclusivo (três caracteres
  iniciam busca), lista vazia, falha HTTP/rede, JSON malformado, campos ausentes
  e arrays desalinhados.
- `useWeather` e componentes: estados idle/loading/success/error, busca vazia,
  texto abaixo do limite sem loading/estado vazio, busca automática a partir de
  três caracteres, seleção da cidade correta, retry, alternância sem nova
  chamada e resposta antiga não sobrescrevendo a seleção atual.
- Acessibilidade: roles e nomes acessíveis, navegação por teclado e mensagens de
  loading/erro/vazio identificáveis.

### E2E — Playwright

- Fluxo de sucesso: buscar, diferenciar/selecionar cidade, exibir clima e cinco
  dias, alternar para Fahrenheit e confirmar unidade consistente sem alterar
  cidade/datas.
- Fluxos de busca sem resultados e falha de previsão com retry.
- Executar em viewport móvel; verificar que busca, seleção, dados e controles
  continuam utilizáveis.
- Interceptar requisições com `page.route` e fixtures determinísticas para não
  depender da disponibilidade da API externa.

Executar os scripts existentes do projeto (`pnpm test`, `pnpm test:e2e`,
`pnpm lint` e `pnpm build`) na etapa de implementação/testes; não são validações
de documentação deste plano.

## 10. Risks & Trade-offs

| Risco ou decisão | Mitigação / trade-off |
| --- | --- |
| API indisponível, lenta ou com limite de uso | Mensagem clara, estado de erro e retry; sem cache na v1 para evitar complexidade não exigida. |
| Cidades homônimas ou contexto insuficiente | Mostrar cidade, região quando disponível e país; quantidade e campos finais dependem da questão 4. |
| Diferenças entre data local e fuso do dispositivo | Usar timezone retornado pela API e datas locais para os dias; confirmar apresentação de horário conforme questão 8. |
| Resposta externa incompleta ou arrays desalinhados | Validar no serviço e falhar de forma explícita, em vez de renderizar previsão enganosa. |
| Conversão de unidade divergente entre componentes | Normalizar em Celsius e centralizar conversão em função pura; sem refazer requisição. |
| Corrida entre consultas rápidas | Cancelar/ignorar respostas anteriores no hook. |
| Escopo de dados ainda indefinido | Modelo/API acima é mínimo proposto; confirmar questões 1–3 antes de estabilizar UI e tarefas detalhadas. |
| Simplicidade versus persistência/configurações adicionais | Sem store, cache, backend ou persistência local na v1; persistência local depende da questão 7. |

### Questões da spec a confirmar

As decisões abaixo são bloqueios para finalizar os detalhes correspondentes, não
para a arquitetura-base:

| Questão | Proposta para orientar as Tasks | O que precisa de confirmação |
| --- | --- | --- |
| 1. Campos do clima atual | Temperatura e código da condição; expandir só após decisão. | Quais outros campos devem aparecer. |
| 2. Granularidade da previsão | Resumo diário, sem previsão por hora. | Se dados por hora são necessários. |
| 3. Campos por dia | Mínima, máxima e código da condição. | Se incluir precipitação ou outros dados. |
| 4. Resultados de cidades | Até cinco; nome, região disponível e país. | Quantidade e campos finais de contexto. |
| 5. Formatos de entrada | Buscar por nome de cidade. | Suporte a CEP, nomes acentuados e nomes em outros idiomas. |
| 6. Busca automática | Automática a partir de três caracteres, com debounce de 300 ms. | — |
| 7. Persistência | Não persistir cidade/unidade nesta versão. | Se preferências devem sobreviver ao retorno. |
| 8. Fuso e atualização | Usar timezone da localização para calendário da previsão; não mostrar horário de atualização nesta proposta mínima. | Exibição de fuso e horário de atualização. |
| 9. Timeout | 10 segundos por chamada; erro recuperável com retry. | — |

As propostas das questões ainda abertas são premissas de planejamento, não
requisitos aprovados. As decisões registradas na spec prevalecem.
