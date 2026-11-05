<div align="center">

# SDD Weather App

### Treinamento hands-on de **Spec-Driven Development** com **GitHub Copilot**

**Brief → Spec → Plan → Tasks → Code → Test → Review → Ship**

</div>

---

Este repositório é um **laboratório de treinamento de 8 horas** que ensina a
construir software guiado por especificação (**Spec-Driven Development**) usando
o **GitHub Copilot** em todas as etapas. O projeto final é um **Weather App** em
React + TypeScript que consome a API Open-Meteo.

> ## Princípio central
> **NÃO COMECE PELO CÓDIGO.** Sempre: **Spec → Plan → Tasks → Code.**

---

## O workshop

Comece pelo **[Guia do Workshop](workshop/GUIDE.md)** e siga os módulos em ordem.

| # | Módulo | Fase | Duração |
| --- | --- | --- | --- |
| 01 | [Setup](workshop/module-01-setup/README.md) | Preparação | 30 min |
| 02 | [Understanding the Problem](workshop/module-02-discovery/README.md) | Discovery | 45 min |
| 03 | [Writing the Specification](workshop/module-03-spec/README.md) | Spec | 50 min |
| 04 | [Creating the Technical Plan](workshop/module-04-plan/README.md) | Plan | 45 min |
| 05 | [Breaking Down Tasks](workshop/module-05-tasks/README.md) | Tasks | 40 min |
| 06 | [Building the UI](workshop/module-06-ui/README.md) | Code | 60 min |
| 07 | [Integrating APIs](workshop/module-07-api/README.md) | Code | 60 min |
| 08 | [Testing](workshop/module-08-testing/README.md) | Test | 55 min |
| 09 | [Hardening](workshop/module-09-hardening/README.md) | Test | 50 min |
| 10 | [Pull Request Review](workshop/module-10-review/README.md) | Review | 45 min |
| 11 | [Delivery (GitHub Pages)](workshop/module-11-delivery/README.md) | Ship | 30 min |

Cada módulo tem **README.md**, **challenge.md**, **prompts.md** e
**solution.md**.

---

## Começando

### Pré-requisitos

- **Node.js**
- **pnpm** (único gerenciador de pacotes suportado — habilite com `corepack enable`)
- **GitHub Copilot** habilitado no VS Code
- Git e uma conta no GitHub (para PR e deploy)

> O repositório inclui um **DevContainer** com tudo pré-configurado. Abra em um
> Codespace ou em "Reopen in Container" e pule a instalação manual.

### Instalação

```bash
pnpm install
pnpm exec playwright install --with-deps chromium webkit   # navegadores e dependências dos testes E2E
```

No Linux, `--with-deps` instala também as bibliotecas de sistema necessárias e
pode solicitar privilégios de administrador. Se os navegadores já estiverem
instalados e houver um aviso de bibliotecas ausentes, execute
`pnpm exec playwright install-deps chromium webkit`.

### Interface integrada à Open-Meteo

A interface React + Tailwind usa o tema dark glassmorphism e layout mobile-first.
Execute `pnpm dev`, digite pelo menos três caracteres do nome de uma cidade e
selecione um dos até cinco resultados. A busca é automática a cada alteração,
sem botão, envio por Enter ou intervalo de debounce definido. Espaços nas
extremidades são desconsiderados ao verificar o limite. Ao reduzir o texto para
menos de três caracteres, os resultados são limpos e consultas pendentes são
canceladas, sem exibir loading ou mensagem de ausência de resultados.
A tela inicia sem cidade selecionada e consulta clima atual e cinco dias
(hoje e os quatro seguintes) no horário local da cidade, sem API key.
Celsius/Fahrenheit altera todas as temperaturas sem novas requisições.

Todo acesso à rede e validação das respostas ficam no
[service](src/services/weatherService.ts). O [hook](src/hooks/useWeather.ts)
coordena loading, vazio, sucesso, erro e nova tentativa, cancelando requisições
obsoletas. Falhas de busca e previsão podem ser repetidas sem redigitar a busca.
Não há persistência, cache ou timeout fixo, conforme as premissas do backlog.

Implementação correspondente às tarefas de integração e orquestração T-06–T-13,
conectadas à interface T-14–T-19. Os dados fictícios ficam apenas nas
[fixtures de teste](tests/fixtures/weather.ts); os testes simulam services ou
interceptam a rede, sem consultar a API real.

### Cobertura dos critérios de aceite

A suíte deriva das US1–US5 e dos edge cases da
[spec](specs/weather-app-spec.md), conforme T-05, T-07, T-09, T-11, T-13,
T-19 e T-20 do [backlog](tasks/weather-app-tasks.md).

| Critérios | Cobertura |
| --- | --- |
| US1: busca, homônimas, seleção e ausência | [Interface integrada](tests/unit/App.test.tsx), [service](tests/unit/weatherService.test.ts) e E2E com seleção por teclado e verificação de coordenadas. |
| US2–US3: clima atual e cinco dias locais | Interface, service e E2E, incluindo virada de ano em fuso diferente do relógio do navegador. |
| US4: Celsius inicial e alternância coerente | [Funções de apresentação](tests/unit/presentation.test.ts), interface, [hook](tests/unit/useWeather.test.ts) e E2E verificam valores, cidade, datas e ausência de novas consultas. |
| US5: loading, erro e retry | Interface, hook e E2E com rede lenta controlada, falha HTTP/rede, JSON malformado e dados incompletos, sem exibir sucesso parcial. |
| RNF1–RNF2: responsividade e acessibilidade | [Componentes](tests/unit/components.test.tsx) e [E2E](tests/e2e/weather-ui.spec.ts) com roles, nomes acessíveis, teclado e viewports de 320 a 1280 pixels. |

Os E2E executam em Chromium desktop e WebKit com viewport iPhone 13.
Consultas lentas são liberadas pelo teste, sem esperas fixas; não há teste de
prazo de timeout porque sua duração permanece em aberto na spec.

### Scripts

```bash
pnpm dev             # servidor de desenvolvimento (Vite)
pnpm build           # build de produção
pnpm preview         # serve o build localmente
pnpm lint            # Biome (lint)
pnpm format          # Biome (formatação)
pnpm check           # Biome (lint + formatação)
pnpm test            # testes unitários (Vitest)
pnpm test:coverage   # cobertura
pnpm test:e2e        # testes E2E (Playwright)
```

---

## Arquitetura do app

```text
src/
├── components/      # apresentação (um componente por arquivo)
│   └── states/      # loading, erro, vazio
├── hooks/           # orquestração (useWeather)
├── services/        # acesso a dados (Open-Meteo) isolado
├── lib/             # funções puras (conversão, formatação, códigos WMO)
├── types/           # contratos compartilhados
├── styles/          # Tailwind + estilos globais
├── App.tsx          # composição da tela
└── main.tsx         # bootstrap React
```

Decisões-chave:

- **Temperaturas em Celsius** internamente; conversão só na apresentação (o
  toggle °C/°F **não** faz nova requisição).
- **Rede isolada** em `services/` — componentes e hooks não conhecem URLs.
- Sempre tratar **loading**, **erro** e **vazio**.

---

## Stack

- **TypeScript** (strict) · **React** · **Vite**
- **Tailwind CSS** (tema dark glassmorphism)
- **Vitest** + **Testing Library** (unit) · **Playwright** (E2E)
- **Biome** (lint + formatação)
- **pnpm** (gerenciador de pacotes)
- **Open-Meteo** (geocoding + forecast, sem API key)

---

## Copilot no fluxo SDD

A pasta `.github/` traz a inteligência do laboratório:

- **`agents/`** — personas especializadas: Spec, Plan, Task, Code, Test, Review.
- **`prompts/`** — prompts de produção para cada etapa.
- **`instructions/`** — convenções (React, Tailwind, Testing) aplicadas
  automaticamente.
- **`workflows/`** — CI (lint/build/test/e2e), deploy no Pages e validações que
  **impõem a ordem Spec → Plan → Tasks**.

Veja [AGENTS.md](AGENTS.md) para a descrição de cada agente.

---

## Idioma

- Narrativa, comentários e documentação: **pt-BR**.
- Identificadores de código, nomes de arquivos e termos técnicos: **en-US**.

---

<div align="center">

Construído com ❤️ para capacitar times em **Spec-Driven Development** usando o poder do GitHub Copilot.

</div>
