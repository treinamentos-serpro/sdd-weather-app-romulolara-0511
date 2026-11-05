# Especificação do Produto — Aplicação de Previsão do Tempo

## 1. Overview

Aplicação web para consultar o clima de cidades. A pessoa usuária pode buscar e
selecionar uma cidade, consultar as condições atuais e a previsão para cinco
dias, e alternar a unidade de temperatura entre Celsius e Fahrenheit.

A experiência deve priorizar o uso em dispositivos móveis e permanecer utilizável
em telas maiores. A interface será em português do Brasil. Esta especificação
considera “cinco dias” como hoje e os quatro dias seguintes, com Celsius como
unidade inicial.

## 2. Functional Requirements

- **RF1 — Buscar cidades:** pesquisar cidades pelo nome automaticamente à medida
  que a pessoa usuária informa o texto, sem exigir o envio manual da busca, e
  apresentar resultados que ajudem a identificar a localização correta.
- **RF2 — Selecionar cidade:** permitir selecionar um resultado de busca; quando
  houver cidades homônimas, apresentar contexto geográfico suficiente para
  distingui-las.
- **RF3 — Consultar clima atual:** após a seleção de uma cidade, apresentar as
  condições atuais associadas à localização selecionada.
- **RF4 — Consultar previsão de cinco dias:** apresentar a previsão para hoje e
  os quatro dias seguintes da cidade selecionada.
- **RF5 — Alternar unidade de temperatura:** permitir alternar entre Celsius e
  Fahrenheit e refletir a unidade escolhida em todas as temperaturas exibidas.
- **RF6 — Comunicar estados da consulta:** informar quando uma busca ou consulta
  está carregando, quando ocorre uma falha e quando a busca não encontra
  resultados.
- **RF7 — Tentar novamente:** oferecer uma forma de repetir a consulta após uma
  falha de carregamento.

## 3. User Stories

### US1 — Encontrar e selecionar uma cidade

Como pessoa que decide a rotina do dia, quero buscar e selecionar uma cidade
para consultar o clima da localização correta.

### US2 — Consultar as condições atuais

Como pessoa que decide a rotina do dia, quero consultar as condições atuais da
cidade selecionada para planejar minhas atividades.

### US3 — Consultar a previsão dos próximos dias

Como pessoa que planeja os próximos dias, quero consultar a previsão de cinco
dias para organizar compromissos e viagens.

### US4 — Escolher a unidade de temperatura

Como pessoa usuária, quero alternar entre Celsius e Fahrenheit para interpretar
as temperaturas na unidade que prefiro.

### US5 — Entender o estado de uma consulta

Como pessoa usuária, quero receber indicação de carregamento, ausência de
resultados ou falha para saber o que está acontecendo e como prosseguir.

## 4. Acceptance Criteria

### Critérios da US1

- Conforme a pessoa usuária digita ou altera o texto da busca, a aplicação
  atualiza automaticamente os resultados correspondentes, sem exigir que ela
  envie a consulta por um botão ou tecla.
- Ao pesquisar uma cidade que tenha resultados, a aplicação apresenta uma lista
  de cidades correspondentes.
- Os resultados incluem contexto geográfico que permita distinguir cidades com
  o mesmo nome.
- Ao selecionar um resultado, a aplicação associa as consultas de clima à
  localização selecionada e identifica essa cidade junto aos dados exibidos.
- Quando a busca não encontra correspondências, a aplicação informa que não há
  resultados, sem apresentar uma cidade como se tivesse sido selecionada.
- A quantidade de resultados e os campos de contexto exibidos devem seguir as
  decisões registradas em **Open Questions**.

### Critérios da US2

- Após uma consulta bem-sucedida, a aplicação apresenta as condições atuais da
  cidade selecionada.
- A temperatura atual, quando apresentada, é acompanhada da unidade selecionada.
- Os dados exibidos são identificados com a cidade selecionada.
- Enquanto a consulta estiver em andamento, a aplicação apresenta um estado de
  carregamento.
- Se a consulta falhar, a aplicação informa a falha e oferece uma nova tentativa.
- Os campos adicionais das condições atuais devem seguir a decisão registrada
  em **Open Questions**.

### Critérios da US3

- Após uma consulta bem-sucedida, a aplicação apresenta uma previsão para hoje e
  para cada um dos quatro dias seguintes, totalizando cinco dias.
- Cada dia da previsão é distinguível dos demais por sua data ou identificação
  equivalente.
- As temperaturas da previsão, quando apresentadas, usam a unidade selecionada.
- Enquanto a consulta estiver em andamento, a aplicação apresenta um estado de
  carregamento.
- Se a consulta falhar, a aplicação informa a falha e oferece uma nova tentativa.
- O nível de detalhe e os dados apresentados por dia devem seguir as decisões
  registradas em **Open Questions**.

### Critérios da US4

- A unidade inicial apresentada é Celsius.
- A pessoa usuária pode alternar entre Celsius e Fahrenheit.
- Após a alternância, todas as temperaturas exibidas passam a indicar a unidade
  escolhida, sem misturar unidades na mesma visualização.
- A alternância não altera a cidade selecionada nem as datas da previsão.

### Critérios da US5

- A aplicação apresenta indicação visual de carregamento enquanto aguarda
  resultados de busca ou dados meteorológicos.
- Uma busca sem correspondências é comunicada como ausência de resultados.
- Uma falha de rede ou do serviço é comunicada como falha, sem ser apresentada
  como resultado válido ou como ausência de resultados.
- Após uma falha, existe uma ação disponível para tentar novamente a consulta.
- O limite de tempo para classificar uma consulta como falha deve seguir a
  decisão registrada em **Open Questions**.

## 5. Non-Functional Requirements

- **RNF1 — Responsividade:** priorizar o uso em dispositivos móveis e manter
  conteúdo e controles utilizáveis em telas maiores.
- **RNF2 — Acessibilidade:** permitir navegação por teclado, fornecer nomes
  acessíveis aos controles e manter estrutura semântica clara.
- **RNF3 — Desempenho percebido:** apresentar retorno visual durante buscas e
  carregamentos, evitando que a interface pareça travada enquanto aguarda dados.
  Não há meta numérica de tempo definida nesta versão.
- **RNF4 — Resiliência:** comunicar falhas de rede ou do serviço de previsão em
  linguagem compreensível e permitir nova tentativa.
- **RNF5 — Clareza dos dados:** identificar a cidade e a unidade de temperatura
  junto às informações correspondentes.
- **RNF6 — Idioma:** apresentar a interface em português do Brasil.

## 6. Edge Cases

- **Busca sem resultados:** informar que nenhuma cidade corresponde à busca.
- **Cidades homônimas:** exibir contexto geográfico suficiente para apoiar a
  escolha da localização correta.
- **Entrada inválida ou não suportada:** não tratar uma entrada que o serviço
  não reconheça como uma cidade selecionada; comunicar o resultado da busca sem
  exibir dados de outra localização.
- **Falha de rede ou indisponibilidade do serviço:** comunicar a falha e
  disponibilizar nova tentativa.
- **Consulta lenta ou timeout:** apresentar o estado de carregamento enquanto
  aguarda; o momento de considerar a consulta expirada depende da decisão em
  **Open Questions**.
- **Dados meteorológicos ausentes ou incompletos:** não apresentar como
  concluídos dados que não foram recebidos; comunicar que a consulta não pôde
  ser concluída e permitir nova tentativa.
- **Alternância de unidade durante consulta ou após erro:** manter a unidade
  selecionada coerente em todos os valores apresentados quando os dados
  estiverem disponíveis; a unidade não deve mascarar o estado de erro ou
  carregamento.
- **Previsão atravessando a mudança de dia:** considerar como período os cinco
  dias definidos na especificação — hoje e os quatro dias seguintes — na
  localização consultada. A apresentação de fuso horário e horário de
  atualização permanece em aberto.

## 7. Assumptions

- A aplicação é destinada a navegadores modernos com conexão à internet.
- O caso de uso inicial é individual; não são necessárias contas de usuário.
- A interface será em português do Brasil.
- A primeira versão não exige persistência de dados em servidor.
- O serviço de dados adotado é o Open-Meteo, com geocodificação e previsão sem
  chave de API.
- A previsão de cinco dias corresponde a hoje e aos quatro dias seguintes.
- Celsius é a unidade inicial, com opção para alternar para Fahrenheit.
- A primeira versão não solicita geolocalização automaticamente.

## 8. Risks

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Indisponibilidade, lentidão ou limitação do serviço de dados | Média | Alto | Apresentar estado de erro e opção de tentar novamente; avaliar cache como decisão futura. |
| Busca retornar cidades homônimas ou uma localização inesperada | Alta | Médio | Exibir contexto geográfico nos resultados para apoiar a seleção. |
| Falha de rede impedir a consulta | Média | Médio | Explicar que os dados não puderam ser carregados e oferecer nova tentativa. |
| Layout ou controles ficarem difíceis de usar em telas pequenas | Média | Alto | Projetar e validar a experiência primeiro em viewport móvel. |
| Alternância de unidade produzir temperaturas inconsistentes | Baixa | Alto | Manter uma única unidade selecionada por vez e validar os valores apresentados. |

## 9. Out of Scope

- Autenticação e contas de usuário.
- Persistência de dados em servidor.
- Solicitação automática de geolocalização na primeira versão.
- Funcionalidades não definidas no briefing, como alertas meteorológicos ou
  mapas. Uma inclusão futura exige definição de escopo e critérios próprios.

## 10. Open Questions

As respostas abaixo precisam ser definidas antes que os detalhes correspondentes
se tornem pressupostos de implementação:

1. **Quais informações devem compor o clima atual além da temperatura?**
   - Impacto: define o conteúdo principal e o nível de detalhe da tela.
2. **A previsão de cinco dias deve mostrar apenas um resumo diário ou também
   informações por hora?**
   - Impacto: afeta a densidade da interface e a forma de apresentar os dados.
3. **Quais dados devem aparecer em cada dia da previsão** (por exemplo,
   temperaturas mínima e máxima, condição ou precipitação)?
   - Impacto: determina quais dados são necessários e como comparar os dias.
4. **Quantos resultados de cidade devem ser exibidos e quais detalhes devem
   distingui-los** (país, estado ou região)?
   - Impacto: afeta a seleção correta, especialmente para cidades homônimas.
5. **A busca deve aceitar apenas nomes de cidades ou também códigos postais,
   acentos e nomes em outros idiomas?**
   - Impacto: define as expectativas de entrada e os casos que precisam ser
     tratados.
6. **Qual deve ser o tamanho mínimo do texto e o intervalo de espera antes de
   iniciar ou atualizar a busca automática durante a digitação?**
   - Impacto: afeta a frequência das consultas e quando os resultados são
     atualizados.
7. **A cidade e a unidade escolhidas devem ser lembradas ao retornar à
   aplicação?**
   - Impacto: determina se haverá persistência de preferências no dispositivo.
8. **Como devem ser tratados fuso horário e horário de atualização das
   informações?**
   - Impacto: evita divergências entre a hora local da cidade e a hora do
     dispositivo.
9. **Qual é o tempo máximo aceitável para uma busca antes de informar falha?**
   - Impacto: influencia quando o estado de erro deve ser mostrado.
