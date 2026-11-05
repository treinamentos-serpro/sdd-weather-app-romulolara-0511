# Discovery — Aplicação de Previsão do Tempo

## Contexto

O produto é uma aplicação web para consultar o clima de cidades. A pessoa usuária
deve conseguir encontrar uma cidade, consultar as condições atuais e a previsão
para cinco dias, e alternar a unidade de temperatura entre Celsius e Fahrenheit.
O uso em dispositivos móveis é prioritário, sem excluir telas maiores.

O briefing define as capacidades principais, mas não especifica detalhes como
quais informações meteorológicas exibir, como desambiguar cidades com o mesmo
nome ou como a previsão deve ser apresentada. Essas decisões precisam ser
refinadas antes da implementação.

## Personas

- **Pessoa que decide a rotina do dia** — consulta rapidamente o clima atual,
  sobretudo pelo celular, para planejar roupa, deslocamento ou atividades.
- **Pessoa que planeja os próximos dias** — consulta a previsão de várias datas
  para organizar compromissos e viagens, tanto no celular quanto em telas
  maiores.

## Requisitos Funcionais

- **RF1 — Buscar cidades:** permitir pesquisar uma cidade pelo nome e selecionar
  o local desejado quando houver mais de um resultado.
- **RF2 — Consultar clima atual:** apresentar as condições atuais da cidade
  selecionada.
- **RF3 — Consultar previsão:** apresentar a previsão do tempo para cinco dias.
- **RF4 — Alternar unidades:** permitir alternar entre Celsius e Fahrenheit e
  refletir a unidade escolhida nas temperaturas exibidas.
- **RF5 — Comunicar estados da consulta:** informar quando os dados estão sendo
  carregados, quando ocorre uma falha e quando não há resultados para a busca.

## Requisitos Não-Funcionais

- **RNF1 — Responsividade:** priorizar a experiência em dispositivos móveis e
  manter o conteúdo utilizável em telas maiores.
- **RNF2 — Acessibilidade:** oferecer navegação por teclado, controles com nomes
  acessíveis e estrutura semântica clara.
- **RNF3 — Desempenho percebido:** apresentar retorno visual durante buscas e
  carregamentos, evitando que a interface pareça travada enquanto aguarda dados.
- **RNF4 — Resiliência:** comunicar falhas de rede ou do serviço de previsão de
  forma compreensível e permitir que a pessoa tente novamente.
- **RNF5 — Clareza dos dados:** identificar a cidade e a unidade de temperatura
  junto às informações correspondentes, reduzindo interpretações equivocadas.

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Indisponibilidade, lentidão ou limitação do serviço de dados | Média | Alto | Apresentar estado de erro e opção de tentar novamente; avaliar cache como decisão futura. |
| Busca retornar cidades homônimas ou uma localização inesperada | Alta | Médio | Exibir contexto geográfico nos resultados para apoiar a seleção. |
| Falha de rede impedir a consulta | Média | Médio | Explicar que os dados não puderam ser carregados e oferecer nova tentativa. |
| Layout ou controles ficarem difíceis de usar em telas pequenas | Média | Alto | Projetar e validar a experiência primeiro em viewport móvel. |
| Alternância de unidade produzir temperaturas inconsistentes | Baixa | Alto | Definir uma única unidade selecionada por vez e validar os valores apresentados. |

## Perguntas em Aberto (Open Questions)

As perguntas abaixo permanecem sem decisão no briefing. Cada resposta pode
alterar o conteúdo, a interação ou a validação do produto.

1. **Quais informações devem compor o clima atual além da temperatura?**
   *Impacto:* define o conteúdo principal e o nível de detalhe da tela.
2. **A previsão de cinco dias deve mostrar apenas um resumo diário ou também
   informações por hora?** *Impacto:* afeta a densidade da interface e a forma
   de apresentar os dados.
3. **Quais dados devem aparecer em cada dia da previsão (por exemplo,
   temperaturas mínima e máxima, condição ou precipitação)?**
   *Impacto:* determina quais dados são necessários e como comparar os dias.
4. **Quantos resultados de cidade devem ser exibidos e quais detalhes devem
   distingui-los (país, estado ou região)?** *Impacto:* afeta a seleção correta,
   especialmente para cidades homônimas.
5. **A busca deve aceitar apenas nomes de cidades ou também códigos postais,
   acentos e nomes em outros idiomas?** *Impacto:* define as expectativas de
   entrada e os casos que precisam ser tratados.
6. **A cidade e a unidade escolhidas devem ser lembradas ao retornar à
   aplicação?** *Impacto:* determina se haverá persistência de preferências no
   dispositivo.
7. **Como devem ser tratados fuso horário e horário de atualização das
   informações?** *Impacto:* evita divergências entre a hora local da cidade e
   a hora do dispositivo.
8. **Qual é o tempo máximo aceitável para uma busca antes de informar falha?**
   *Impacto:* influencia quando o estado de erro deve ser mostrado.

## Suposições (Assumptions)

- A experiência deve funcionar em navegadores modernos com conexão à internet.
- O caso de uso é individual; contas de usuário não são necessárias para o
  escopo inicial.
- A interface será escrita em português do Brasil.
- A primeira versão não exige persistência de dados em servidor.
- O serviço de dados adotado para o treinamento será o Open-Meteo, que oferece
  geocodificação e previsão sem exigir chave de API.

## Decisões

Para destravar a próxima etapa do treinamento, ficam adotadas estas decisões
iniciais:

- **Fonte de dados:** Open-Meteo para geocodificação e previsão, sem chave de API.
- **Interpretação de “cinco dias”:** hoje e os quatro dias seguintes.
- **Unidade inicial:** Celsius; a pessoa poderá alternar para Fahrenheit.
- **Idioma da interface:** português do Brasil (pt-BR).
- **Acesso e dados:** sem autenticação e sem persistência em servidor na primeira
  versão.
- **Localização:** sem solicitação automática de geolocalização na primeira
  versão.

As demais perguntas em aberto devem ser respondidas durante a elaboração da
especificação do produto, antes de se tornarem pressupostos de implementação.
