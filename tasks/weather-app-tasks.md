# Backlog de Tarefas — Aplicação de Previsão do Tempo

Derivado do [plano técnico](../plans/weather-app-plan.md) e da
[especificação do produto](../specs/weather-app-spec.md). As tarefas estão
ordenadas por dependência e organizadas por entrega.

## Premissas para execução

- O escopo funcional é o da spec; decisões ainda abertas nas questões 1–9 da spec
  devem ser confirmadas antes de estabilizar os campos e a apresentação afetados.
- A busca é automática a partir de três caracteres. Entradas menores não iniciam
  requisição nem são tratadas como busca vazia; ao encurtar o texto, resultados
  anteriores devem ser limpos ou invalidados. O intervalo/debounce segue pendente:
  não assumir uma duração sem decisão registrada.
- Enquanto não houver decisão registrada, implementar somente a proposta mínima
  do plano: até cinco resultados de geocodificação; clima atual com temperatura
  e código; previsão diária com mínima, máxima e código; sem persistência;
  timezone local da cidade; sem duração de timeout definida. Não transformar
  essas propostas em requisitos aprovados nem adicionar campos fora do escopo.
- O modelo interno mantém temperaturas em Celsius. A previsão contém hoje e os
  quatro dias seguintes no timezone da localização selecionada.
- Caminhos de teste abaixo são propostos dentro de `tests/`; ajustar apenas se a
  convenção já adotada pelo projeto indicar outro local.

## Entrega 1 — Alinhamento e contratos

### T-01 — Registrar decisões pendentes que afetam a implementação

- **Requisitos:** RF1–RF7; US1–US5; questões em aberto 1–9 da spec.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`.
- **Critérios de aceite:**
  - Cada questão aberta que altere campos, comportamento ou escopo tem uma
    decisão registrada, ou permanece explicitamente pendente sem ser convertida
    em requisito.
  - Busca automática a partir de três caracteres e ausência de requisição abaixo
    desse limite são mantidas como comportamento definido no plano; o intervalo
    de debounce permanece sem valor presumido até decisão específica.
  - Quantidade/contexto dos resultados, entrada aceita, dados meteorológicos,
    persistência, timezone e timeout não ficam contraditórios entre spec e plano.
  - Nenhum detalhe proposto pelo plano é apresentado como decisão aprovada sem
    registro.

### T-02 — Definir os tipos compartilhados de clima e estado da tela

- **Requisitos:** RF1–RF7; RNF5.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/types/weather.ts`.
- **Critérios de aceite:**
  - Existem tipos para `TemperatureUnit`, `City`, `CurrentWeather`,
    `ForecastDay`, `WeatherData` e os estados discriminados da tela.
  - `WeatherData` representa cidade, timezone, clima atual e previsão; cada dia
    inclui data, mínima, máxima e código da condição.
  - Os tipos deixam explícitos os campos opcionais aprovados e não permitem
    tratar ausência de resultados como cidade selecionada.

## Entrega 2 — Funções de domínio e apresentação

### T-03 — Implementar conversão e formatação de temperatura

- **Requisitos:** RF5; US4; RNF5.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/lib/temperature.ts`.
- **Critérios de aceite:**
  - Funções puras convertem Celsius para Fahrenheit e formatam a temperatura na
    unidade e locale `pt-BR`.
  - O modelo de dados permanece em Celsius; a conversão não altera os dados
    recebidos nem depende de estado global.

### T-04 — Mapear códigos meteorológicos e formatar datas locais

- **Requisitos:** RF3–RF4; US3; RNF5.
- **Dependências:** T-01, T-02.
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`, `src/lib/date.ts`.
- **Critérios de aceite:**
  - Códigos meteorológicos previstos são convertidos em rótulos compreensíveis
    em pt-BR, com comportamento definido para código não mapeado.
  - Datas da previsão são apresentadas de forma legível e distinguível, sem
    substituir a data local recebida por uma data calculada no timezone do
    dispositivo.

### T-05 — Testar funções de temperatura, códigos e datas

- **Requisitos:** RF3–RF5; US3–US4.
- **Dependências:** T-03, T-04.
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`,
  `tests/unit/weatherCodes.test.ts`, `tests/unit/date.test.ts`.
- **Critérios de aceite:**
  - Testes cobrem a apresentação em Celsius e Fahrenheit, temperaturas negativas
    e formatação com unidade.
  - Testes cobrem códigos conhecidos e desconhecidos, datas locais e sequência
    de hoje mais os quatro dias seguintes.
  - Os testes não dependem de rede nem do timezone acidental da máquina.

## Entrega 3 — Integração com Open-Meteo

### T-06 — Implementar busca e normalização de cidades

- **Requisitos:** RF1–RF2; US1.
- **Dependências:** T-01, T-02.
- **Arquivos prováveis:** `src/services/weatherService.ts`.
- **Critérios de aceite:**
  - `searchCities(query)` consulta o endpoint de Geocoding com os parâmetros
    acordados e mapeia resultados para `City`.
  - Entradas com menos de três caracteres não chegam ao endpoint; três
    caracteres são suficientes para iniciar a busca.
  - Uma resposta válida sem resultados retorna lista vazia.
  - Resposta HTTP malsucedida, JSON inválido ou campos obrigatórios inválidos
    produzem erro propagável, não lista vazia.
  - A função aceita sinal de cancelamento para busca obsoleta.

### T-07 — Testar busca e normalização de cidades

- **Requisitos:** RF1–RF2; RF6; US1; US5.
- **Dependências:** T-06.
- **Arquivos prováveis:** `tests/unit/weatherService.search.test.ts`.
- **Critérios de aceite:**
  - Testes verificam URL/parâmetros, mapeamento de cidade e contexto geográfico,
    resultado vazio e uso do sinal de cancelamento.
  - Testes confirmam que uma entrada curta não gera requisição e que o limite é
    inclusivo (três caracteres podem consultar).
  - Testes distinguem resposta vazia válida de falha HTTP, de rede, JSON
    malformado e dados inválidos.
  - Nenhum teste acessa a API real.

### T-08 — Implementar consulta e validação de clima e previsão

- **Requisitos:** RF3–RF4; RF7; US2–US3.
- **Dependências:** T-01, T-02.
- **Arquivos prováveis:** `src/services/weatherService.ts`.
- **Critérios de aceite:**
  - `getWeather(city)` usa as coordenadas da cidade selecionada, solicita Celsius,
    timezone automático e cinco dias.
  - A resposta é normalizada em `WeatherData`; arrays diários paralelos são
    combinados por índice somente após validar tipos e comprimentos.
  - São validados os campos obrigatórios de clima atual, timezone e cinco dias.
    Respostas incompletas ou inválidas geram erro, sem retornar dados parciais.
  - A função aceita sinal de cancelamento.

### T-09 — Testar consulta e validação de previsão

- **Requisitos:** RF3–RF4; RF7; US2–US3; RNF5.
- **Dependências:** T-08.
- **Arquivos prováveis:** `tests/unit/weatherService.forecast.test.ts`.
- **Critérios de aceite:**
  - Testes verificam coordenadas, parâmetros de consulta, normalização e cinco
    dias na ordem recebida.
  - Testes cobrem falha HTTP/rede, JSON inválido, campos obrigatórios ausentes,
    timezone inválido e arrays diários ausentes, curtos ou desalinhados.
  - Nenhum caso inválido é apresentado como consulta concluída e nenhum teste
    acessa a API real.

## Entrega 4 — Estado e orquestração

### T-10 — Implementar busca de cidades no hook

- **Requisitos:** RF1; RF6; US1; US5.
- **Dependências:** T-02, T-06.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`.
- **Critérios de aceite:**
  - O hook inicia em estado `idle` e expõe operação de busca e estado necessário
    para apresentar carregamento, resultados e erro.
  - Só inicia a busca a partir de três caracteres; abaixo do limite não mostra
    loading nem ausência de resultados e invalida resultados de texto anterior.
  - Uma busca válida sem correspondências permanece distinta de falha.
  - Busca nova cancela ou invalida a anterior; somente a busca vigente pode
    atualizar o estado.
  - Cancelamento por obsolescência não é comunicado como erro à pessoa usuária.

### T-11 — Testar busca e estados do hook

- **Requisitos:** RF1; RF6; US1; US5.
- **Dependências:** T-10.
- **Arquivos prováveis:** `tests/unit/useWeather.search.test.ts`.
- **Critérios de aceite:**
  - Testes cobrem estado inicial, loading, resultados, lista vazia e erro.
  - Testes confirmam que texto com menos de três caracteres não inicia busca,
    loading ou estado vazio, e que três caracteres iniciam a busca.
  - Reduzir o texto abaixo do limite enquanto há consulta pendente impede a
    resposta obsoleta de atualizar os resultados.
  - Uma resposta antiga ou cancelada não substitui os resultados da busca mais
    recente.
  - Os testes isolam o serviço e não fazem requisições externas.

### T-12 — Implementar seleção, consulta, retry e unidade no hook

- **Requisitos:** RF2–RF7; US1–US5; RNF5.
- **Dependências:** T-02, T-03, T-08, T-10.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`.
- **Critérios de aceite:**
  - Selecionar uma cidade consulta usando suas coordenadas e mantém essa cidade
    associada aos dados exibidos.
  - O estado de loading, sucesso e erro representa a consulta; em erro, a cidade
    selecionada é preservada e `retry()` repete a consulta para ela.
  - Consulta de cidade selecionada mais recentemente prevalece sobre respostas
    anteriores, sem confundir seu cancelamento intencional com falha.
  - A unidade inicial é Celsius; alternar unidade não refaz a consulta nem muda
    cidade, datas, loading ou erro.

### T-13 — Testar seleção, retry, concorrência e unidade no hook

- **Requisitos:** RF2–RF7; US1–US5.
- **Dependências:** T-11, T-12.
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`.
- **Critérios de aceite:**
  - Testes cobrem seleção da cidade correta, sucesso, falha, preservação da
    cidade, retry e cancelamento/resposta fora de ordem.
  - Alternar unidade não chama novamente o serviço e não limpa nem mascara
    loading ou erro.
  - Os testes usam serviços controlados e não dependem da API externa.

## Entrega 5 — Interface

### T-14 — Criar composição principal e layout responsivo

- **Requisitos:** RNF1; RNF5–RNF6.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/App.tsx`, `src/main.tsx`, `src/styles/`.
- **Critérios de aceite:**
  - `App` compõe a experiência sem duplicar lógica de dados do hook.
  - O layout prioriza viewport móvel e continua utilizável em telas maiores.
  - Conteúdo e mensagens próprios da aplicação estão em pt-BR.

### T-15 — Implementar busca e seleção de cidades na interface

- **Requisitos:** RF1–RF2; RF6; US1; US5; RNF2–RNF3.
- **Dependências:** T-10, T-14.
- **Arquivos prováveis:** `src/components/SearchBar.tsx`,
  `src/components/CityResults.tsx`.
- **Critérios de aceite:**
  - Alterar o texto inicia a busca automaticamente, sem botão/tecla de envio,
    somente quando há pelo menos três caracteres.
  - Texto abaixo do limite não exibe loading nem “nenhum resultado”; os resultados
    anteriores deixam de parecer associados ao texto atual.
  - Não se presume um intervalo de debounce; qualquer intervalo deve seguir uma
    decisão registrada na questão 6 da spec.
  - A busca aceita nome de cidade e renderiza opções com nome e contexto
    geográfico definido para distingui-las.
  - Selecionar uma opção encaminha o objeto dessa cidade ao hook, não apenas o
    texto digitado.
  - Entrada e opções têm nomes acessíveis e podem ser operadas por teclado.

### T-16 — Apresentar clima atual e previsão de cinco dias

- **Requisitos:** RF2–RF4; US2–US3; RNF5–RNF6.
- **Dependências:** T-02, T-04, T-14.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`,
  `src/components/ForecastList.tsx`, `src/components/ForecastDayCard.tsx`.
- **Critérios de aceite:**
  - O clima atual identifica a cidade e apresenta temperatura e condição
    conforme decisões registradas.
  - A previsão apresenta exatamente cinco dias identificáveis pela data e
    valores mínimos/máximos e condição conforme o escopo aprovado.
  - Todos os valores usam os dados da cidade selecionada; nenhuma seção sugere
    dados de outra localização.

### T-17 — Implementar seletor de unidade e apresentação consistente

- **Requisitos:** RF5; US4.
- **Dependências:** T-03, T-12, T-16.
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`,
  `src/components/CurrentWeather.tsx`,
  `src/components/ForecastDayCard.tsx`.
- **Critérios de aceite:**
  - O controle permite selecionar Celsius ou Fahrenheit e informa sua seleção
    de forma acessível.
  - Toda temperatura visível muda para a unidade selecionada, com símbolo ou
    unidade explícita; não há mistura de unidades.
  - Cidade e datas permanecem iguais e nenhuma nova chamada à API é feita.

### T-18 — Implementar estados visuais de loading, vazio e erro com retry

- **Requisitos:** RF6–RF7; US2–US3; US5; RNF2–RNF4.
- **Dependências:** T-12, T-14, T-15, T-16.
- **Arquivos prováveis:** `src/components/states/LoadingState.tsx`,
  `src/components/states/ErrorState.tsx`,
  `src/components/states/EmptyState.tsx`, `src/App.tsx`.
- **Critérios de aceite:**
  - Busca e consulta meteorológica exibem loading perceptível e distinguível.
  - Busca sem resultados exibe ausência, sem inventar seleção ou dados.
  - Falha exibe mensagem compreensível em pt-BR e retry para a consulta de clima
    preserva a cidade selecionada.
  - Estados mantêm semântica acessível e não mostram resposta parcial como
    sucesso.

### T-19 — Testar componentes e acessibilidade da interface

- **Requisitos:** RF1–RF7; RNF1–RNF6.
- **Dependências:** T-15, T-16, T-17, T-18.
- **Arquivos prováveis:** `tests/unit/components/`.
- **Critérios de aceite:**
  - Testes de interface cobrem busca, seleção, clima, cinco dias, troca de
    unidade, loading, vazio, erro e retry.
  - Testes de interface cobrem busca automática no limite de três caracteres,
    estado sem busca para texto menor e limpeza/invalidação de resultados antigos.
  - Roles, nomes acessíveis e operação por teclado são verificados nos controles
  e estados relevantes.
  - Testes não dependem de rede nem de conteúdo externo variável.

## Entrega 6 — Fluxos integrados e hardening

### T-20 — Validar fluxos ponta a ponta em viewport móvel

- **Requisitos:** RF1–RF7; US1–US5; RNF1–RNF6.
- **Dependências:** T-07, T-09, T-13, T-19.
- **Arquivos prováveis:** `tests/e2e/weather-flow.spec.ts` e fixtures E2E.
- **Critérios de aceite:**
  - Fluxo de sucesso cobre busca, seleção, identificação da cidade, clima atual,
    cinco dias e alternância para Fahrenheit sem mudar cidade/datas.
  - A busca acontece sem envio manual a partir de três caracteres; abaixo do
    limite não aparecem resultados nem mensagem de busca vazia.
  - Fluxos de busca sem resultados e falha de previsão com retry são verificados.
  - Os cenários são executados em viewport móvel e confirmam usabilidade dos
    controles e dados.
  - Requisições são interceptadas com fixtures determinísticas; a suíte não
    depende de disponibilidade da API Open-Meteo.

### T-21 — Executar validações do projeto e corrigir regressões relacionadas

- **Requisitos:** RNF1–RNF6; qualidade transversal.
- **Dependências:** T-19, T-20.
- **Arquivos prováveis:** arquivos alterados em `src/` e `tests/`.
- **Critérios de aceite:**
  - `pnpm lint`, `pnpm build`, `pnpm test` e `pnpm test:e2e` executam sem falhas.
  - Problemas encontrados nas mudanças deste backlog são corrigidos e os
    comandos afetados são executados novamente.
  - Não são introduzidas geolocalização automática, autenticação, backend ou
    persistência fora do escopo aprovado.
