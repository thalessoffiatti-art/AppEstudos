# Handoff — Autos do Estudo (TRT4 · Analista Judiciário, Área Judiciária)

Contexto para outra sessão do Claude continuar este trabalho sem precisar
reconstruir o histórico. Escrito em 2026-09-14, referente ao trabalho
concluído em 2026-08-26.

## O que é este projeto

Um aplicativo de estudo em **arquivo HTML único e autocontido** (sem build,
sem framework, sem dependência de rede para funcionar), para quem estuda para
o concurso de Analista Judiciário — Área Judiciária do TRT da 4ª Região.

Pasta de trabalho: `C:\Users\thale\Documents\TRT4 estudo\`

### Arquivos do projeto

- **`trt4-analista-judiciario-area-judiciaria.html`** — o aplicativo em si.
  ~769 KB, ~8.480 linhas. É o único arquivo que o usuário final abre.
- **`cronograma-trt4-ajaj.md`** — cronograma de estudos de 13 semanas que foi
  a fonte de conteúdo para a página de cronograma incorporada ao HTML. Pode
  ser consultado para entender a lógica do cronograma, mas o conteúdo já foi
  todo internalizado no HTML — não precisa ser reprocessado.
- Outros arquivos na pasta (`IN 39 interativa.html`,
  `IN39(atualizada)-TST_CPC-no-Processo-do-Trabalho2.html`, um PDF da CLT)
  **não fazem parte deste projeto** — são materiais soltos do usuário, não
  tocados nesta conversa.

Não há repositório git nesta pasta.

## Estrutura do HTML (para orientação rápida)

Documento único com `<style>` no `<head>` e `<script>` antes de `</body>`.

**Paleta de cores (variáveis CSS em `:root`)** — reutilizar, nunca inventar
nova paleta:
`--papel`, `--papel-2`, `--superficie`, `--tinta`, `--tinta-2`, `--tinta-3`,
`--petroleo`, `--petroleo-claro`, `--grifo`, `--grifo-suave`, `--carmim`,
`--carmim-suave`, `--verde`, `--verde-suave`, `--linha`, `--linha-forte`.
Fontes: Zilla Slab (títulos), Public Sans (corpo), IBM Plex Mono (mono/labels).

**Páginas (seções `<section class="pagina" id="pg-...">`), nesta ordem:**

| # | id | Rótulo no menu |
|---|---|---|
| 01 | `pg-inicio` | Panorama |
| 02 | `pg-incidencia` | Índice de incidência |
| 03 | `pg-cronograma` | Cronograma |
| 04 | `pg-material` | Material de estudo |
| 05 | `pg-questoes` | Banco de questões |
| 06 | `pg-provas` | Provas originais (Qconcursos) |
| 07 | `pg-metodo` | Metodologia e fontes |

Navegação: `abrirPagina(pg, anc)` alterna `.ativa` entre as seções e, se `anc`
for passado, abre o `<details>` correspondente e rola até ele.
`irParaMaterial(anc)` é o atalho usado por questões e cronograma para saltar
até um tópico do material.

**Estruturas de dados no `<script>`:**

- `DISCIPLINAS`, `ANOS`, `ASSUNTOS` — dados de incidência (não tocar, é
  histórico das 4 provas reais).
- `QC`, `PROVAS` — links para o Qconcursos (não tocar).
- `QUESTOES` — array de 309 questões autorais (formato abaixo).
- `COTA_SIMULADO` — cota por disciplina para o simulado de 60 questões.
- `CRONOGRAMA` — array de 13 semanas × ~9 blocos (117 blocos), adicionado
  nesta sessão.

**Formato de um item de `QUESTOES`:**

```js
{id, mat, ass, ano, anc, fund, apoio?, en, alt:[5], ok, exp:[5]}
```

- `anc`: id de um `<details class="topico">` da página de material — precisa
  existir de fato, sem âncoras órfãs.
- `ok`: índice 0-4 da alternativa correta.
- `exp`: comentário para **cada uma** das 5 alternativas (explicando por que
  está certa ou errada). Só `<b>`, `<i>`, `<u>` são renderizados nos
  comentários (via `escRico`); qualquer outra tag aparece como texto literal.

**Formato de um item de `CRONOGRAMA`:**

```js
{ semana, inicio:'AAAA-MM-DD', fim:'AAAA-MM-DD', marco:bool,
  blocos:[ {id, mat, titulo, anc: 'topico-id'|null, dia} ] }
```

**Funções centrais:** `esc`, `escRico`, `fichaHTML`, `responder`,
`pintarFicha`, `renderQuestoes`, `atualizarPlacar`, `baralhar`,
`sortearSimulado`, `irParaMaterial`, `abrirPagina` — e, adicionadas nesta
sessão: camada de persistência (`LS`, ver abaixo), `renderCronograma`,
`renderDesempenho`, `renderHistorico`, `salvarRespostas`,
`salvarCronograma`, `conferirFimDeSimulado`, `semanaCorrente`,
`faseCorrente`.

## O que foi feito nesta sessão (PASSOS 0–5 concluídos)

Ponto de partida: app com 103 questões, sem persistência, sem cronograma.
Ponto de chegada, validado:

1. **Persistência em localStorage**, namespace `trt4:` (chaves
   `trt4:respostas`, `trt4:cronograma`, `trt4:historicoSimulados`). Toda
   operação protegida por try/catch com fallback silencioso para memória
   (modo privativo / `file://` restrito), com aviso discreto no rodapé e na
   página de cronograma quando a persistência está inativa. Botão
   "Zerar progresso" na página de metodologia, com confirmação em duas
   etapas, que só remove chaves do namespace `trt4:`.

2. **Página de cronograma** (`pg-cronograma`), nova entrada no menu entre
   "Índice de incidência" e "Material de estudo" (páginas seguintes
   renumeradas). Conteúdo integral do `cronograma-trt4-ajaj.md` convertido
   à mão em HTML estático (sem parser de markdown): tabelas de distribuição
   de carga, grade semanal, feriados, metas de acompanhamento, estudo de
   caso, ressalvas finais. 13 semanas × 117 blocos, com barra de progresso
   geral, destaque visual para a semana 10 (pico) e para a semana corrente
   (calculada por data real). Cada bloco tem checkbox "estudado" e link
   "ver no material" quando há `anc` válida (89 blocos têm; 28 ficam com
   `anc:null` — simulados, estudos de caso e dois pontos do CPC sem tópico
   correspondente no material).

3. **Painel "Meu desempenho"** na página de cronograma, alimentado
   automaticamente pelas respostas em `QUESTOES`/localStorage: tabela por
   disciplina (respondidas/acertos/erros/%/questões na prova via
   `COTA_SIMULADO`), barra comparando com a meta da fase, destaque para o
   "bloco crítico" (Proc. do Trabalho + Proc. Civil + Legislação, 18/60
   questões), histórico de simulados com sparkline SVG inline. Disciplina
   sem resposta mostra "—", nunca 0%.

4. **Banco de questões triplicado**: de 103 para **309**, mantendo a
   proporção original por disciplina. Todas autorais, estilo FCC, com
   fundamento legal citado, 5 alternativas comentadas, âncora válida,
   distribuição equilibrada de anos (2006/2011/2015/2022) e de gabaritos.
   Prefixos de id por disciplina: `PT` (Português), `RL` (Raciocínio
   Lógico), `DA` (Administrativo), `PT_T` (Processual do Trabalho), `DT`
   (Trabalho), `PC` (Processual Civil), `CO` (Constitucional), `LG`
   (Legislação/Digital).

5. **Validação**: script Node ad-hoc (não incluído no repo, foi descartável
   no scratchpad da sessão anterior) checou balanceamento de tags, ids
   duplicados, âncoras órfãs, `node --check` do script, contagem e
   integridade estrutural das 309 questões, 300 sorteios de
   `sortearSimulado()` sempre com 60 ids únicos respeitando a cota, e ciclo
   completo de persistência. Tudo passou. Testado também ao vivo num
   servidor HTTP local (localStorage real): simulado completo, reload com
   progresso recuperado, zerar em duas etapas, layout em 375px sem scroll
   horizontal no body.

### Restrições que foram respeitadas (e devem continuar sendo)

- Não alterar as 103 questões originais, os 85 excertos de lei, os 116
  links do Planalto, a página de provas (`pg-provas`).
- Nenhuma biblioteca, CDN, framework ou etapa de build.
- Um único arquivo HTML de saída, zero requisição de rede necessária para
  funcionar (links de navegação para planalto.gov.br/qconcursos.com são só
  links, não dependências).
- Identidade visual (serifada, papel/tinta, carimbos) preservada.
- Responsivo para celular (tabelas largas rolam dentro de contêiner próprio
  via classe `.tabela-rolagem`, sem estourar o body).
- Questões são **autorais**, nunca reprodução literal de enunciados de
  provas reais (direito autoral da FCC).

## Estado atual: concluído e validado

Não há pendências conhecidas do escopo pedido. Duas observações registradas
para quem for expandir o conteúdo:

- **Legislação e Direito Digital** tem incidência real só em 2015 e 2022
  (a disciplina não existia nas provas de 2006/2011) — por isso a
  distribuição de anos das questões dessa matéria é 0/0/8/16, e isso é
  proposital, não bug.
- **Regimento Interno do TRT4** é referenciado no cronograma (semanas 3–6)
  mas **não** foi usado como fundamento de nenhuma questão nova, porque o
  Regimento muda por emenda regimental e não havia como confirmar a versão
  vigente. As questões de Legislação usam Lei 7.701/1988, CF (arts.
  111/112/115/116) e Lei 11.416/2006, que são estáveis.

## Se for continuar a trabalhar neste arquivo

- Antes de editar, refaça o reconhecimento: leia o CSS de `:root`, o menu
  (`<nav class="menu" id="menuNav">`), e o início do `<script>` com as
  constantes de dados.
- Para adicionar questões, siga exatamente o formato de `QUESTOES` acima e
  confirme que o `anc` aponta para um `id` de `<details class="topico">`
  que realmente existe — não inventar tópico novo no material sem também
  criá-lo lá.
- Para expandir o cronograma ou trocar datas, a constante `CRONOGRAMA` está
  isolada logo antes do bloco de comentário `BANCO DE QUESTÕES`.
- Trabalhe em lotes pequenos e valide a cada lote (balanceamento de tags,
  ids únicos, âncoras, `node --check`, sorteio de simulado) — é o padrão que
  funcionou bem nesta sessão, evitando reescrever o arquivo inteiro a cada
  passo.
- Não existe processo de build: qualquer edição no HTML já é o entregável
  final.

---

# Adendo — 2026-09-20

O texto acima é de 2026-09-14 e descreve um estágio muito mais antigo do
projeto (309 questões, pasta sem git). **Está desatualizado nos números e na
localização**, mas a seção "Estrutura do HTML" continua útil como orientação
geral de formato. Este adendo documenta o estado real atual e o que falta
fazer, sem reescrever o texto antigo.

## Onde o projeto está agora

- **Repositório git**, remoto `thalessoffiatti-art/AppEstudos`.
- **Esta sessão roda num worktree**, não na pasta principal:
  `C:\Users\thale\Documents\GitHub\AppEstudos\.claude\worktrees\questoes-historico-in39-139338\`.
  A pasta principal é `C:\Users\thale\Documents\GitHub\AppEstudos\` (onde
  este `HANDOFF-projeto.md` vive) — os dois diretórios têm o mesmo repositório
  git, mas checkouts de branches diferentes; edite sempre pelo worktree.
- **Branch atual:** `claude/lei-8112-adicionais`, commit `6ddd798`, já
  **enviado ao remoto** (`git push` feito). **Nenhum PR foi aberto ainda** —
  não há `gh` disponível nem Chrome conectado nesta sessão. Link pronto para
  abrir manualmente ou numa sessão com navegador:
  `https://github.com/thalessoffiatti-art/AppEstudos/compare/main...claude/lei-8112-adicionais?expand=1`
- `main` está em `dce6f9b` (PR #2 mergeado). O branch atual parte dele e
  soma dois commits: `041c534` (Lei 8.112 — lacunas de artigos e
  gratificações) e `6ddd798` (cobertura do edital 2022 no cronograma e
  manual — ver abaixo).

## Números atuais do `index.html` (no worktree)

- **514 questões** em `QUESTOES` (não mais 309).
- **`CRONOGRAMA`: 13 semanas, 147 blocos** (não mais 117) — o commit
  `6ddd798` reprogramou a grade a partir da semana 4 (21/09/2026) para
  cobrir Raciocínio Lógico, teoria de Direito do Trabalho, todo o programa
  de Português e um bloco novo "ponto do edital sem semana própria"
  (procedimento **P16**). As semanas 1 a 3, já estudadas, **não foram
  alteradas** — grade, horários e conteúdo continuam os de antes; os ids dos
  blocos não mudaram, então progresso já marcado permanece válido.
- Páginas do menu, na ordem atual (mais páginas que o texto antigo lista):
  01 Panorama · 02 Índice de incidência · 03 Cronograma ·
  **03.1 Manual operacional** · 04 Material de estudo ·
  **04.1 IN 39 interativa** · **04.2 Jurisprudência que cai** ·
  05 Banco de questões · 06 Provas originais · 07 Metodologia e fontes.
- Cache do service worker: `autos-do-estudo-v7`.
- O `index.html` é **CRLF no checkout** (`core.autocrlf=true` no repo).
  Editar por script exige ler, normalizar para `\n`, editar, gravar de volta
  em `\r\n` — conferir depois com um contador de CRLF/LF solto em Node.

## Fontes legais e de jurisprudência — mudou desde a última sessão

O usuário organizou material que antes era dependência externa (fetch no
navegador ou inacessível por anti-bot):

- **`C:\Users\thale\Documents\GitHub\AppEstudos\Leis\`** — pasta nova, com
  os textos de lei em HTML/PDF prontos para conferência local, sem precisar
  de rede: `CLT - 15.06.26.pdf`, `CPC.html`, `Constituicao-Compilado.htm`
  (CF/1988), `Lei8112.html`, `Licitacoes.html` (Lei 14.133/2021),
  `IN39(atualizada)-TST_CPC-no-Processo-do-Trabalho2.html`. **Estes arquivos
  não são versionados no git** (materiais de apoio do usuário, não do app).
- **`C:\Users\thale\Documents\GitHub\AppEstudos\Jurisprudência\sumulas_stj.md`**
  — arquivo novo (~5,8 MB), com as súmulas do STJ anotadas por completo.
  **Isso substitui o obstáculo anterior**: a memória
  `fontes-jurisprudencia-acesso.md` registrava que o STJ tinha "anti-robô,
  não contornar" e listava 12 súmulas marcadas `conf:false` em `JURIS`
  (dentro do `index.html`, bloco "04.2 Jurisprudência que cai") por não
  terem sido conferidas. **Agora dá para conferir essas 12 diretamente
  neste arquivo local**, sem tentar acessar o site do STJ. Ainda não foi
  feito nesta sessão — fica como tarefa pendente.
- A pasta `Provas/` (provas e gabaritos oficiais em PDF de 2006, 2011/2012,
  2015 e 2022) já existia de sessão anterior e continua no lugar, também
  fora do git.

## Tarefa pedida e interrompida — verificação completa contra o edital

O usuário pediu, depois do commit `6ddd798`:

> "Faça mais uma verificação completa, item por item do edital, analisando
> se o cronograma cobre expressamente cada ponto, bem como o que foi
> cobrado nas provas (para não escapar nada)."

Essa tarefa **foi interrompida pelo usuário antes de eu começar** (nenhuma
exploração foi feita ainda nesta rodada). É a próxima coisa a fazer.
Diferença em relação à verificação já feita no commit anterior: daquela vez
eu só tinha o Anexo II do edital (PDF baixado da web) e a memória do que
já sabia sobre as provas; agora o usuário disponibilizou os **textos de lei
completos em `Leis/`** e as **súmulas do STJ completas** em
`Jurisprudência/sumulas_stj.md`, então a nova verificação deve:

1. Reler o Anexo II do Edital nº 01/2022 (ver se ainda está no scratchpad da
   sessão anterior — provavelmente não, sessões novas têm scratchpad
   próprio; se não estiver, baixar de novo:
   `https://www.concursosfcc.com.br/concursos/trt4r122/edital_de_abertura_trt4_-_versao_05_05_2022_-_final_-_v_15-53.pdf`).
2. Conferir, item por item do Anexo II, se cada ponto tem bloco expresso no
   `CRONOGRAMA` (página 03) e no manual 03.1 (script de extração de
   inventário é um bom padrão — ver abaixo).
3. Cruzar com o que **efetivamente foi cobrado** nas quatro provas reais
   (`DISCIPLINAS`/`ANOS`/`ASSUNTOS` no `index.html`, mais os PDFs de
   `Provas/`), para garantir que nenhum assunto recorrente ficou de fora.
4. Usar os arquivos de `Leis/` para conferir citações de artigo por artigo
   (evita ter que reabrir o navegador para o Planalto) e
   `Jurisprudência/sumulas_stj.md` para resolver as súmulas do STJ ainda
   marcadas `conf:false` em `JURIS`.
5. Reportar lacunas remanescentes (se houver) e, se o usuário confirmar,
   aplicar os ajustes seguindo o mesmo padrão desta sessão: escrever os
   textos novos em arquivos de scratchpad, aplicar com um script Node que
   lê/normaliza/edita/grava em CRLF, validar com o checador estrutural, e
   testar em 375px e no fluxo de responder questões antes de commitar.

## Environment/técnico

- Modelo trocado a meio da sessão para **Sonnet 5** (antes era Opus 5) —
  sem impacto no código, só registro.
- Sem `gh` CLI nem Chrome conectado nesta sessão; PRs são abertos via URL
  de comparação do GitHub preenchida manualmente (ver link acima).
- O scratchpad da sessão anterior (onde ficaram os scripts geradores
  `dados_grade.js`, `gerar_semanas.js`, os blocos de material em HTML, o
  script de checagem estrutural `checar.js`, etc.) **não persiste entre
  sessões** — está em
  `C:\Users\thale\AppData\Local\Temp\claude\...\<hash-da-sessão>\scratchpad\`
  e o hash muda a cada sessão nova. Isso não é um problema para continuar o
  trabalho, porque **todo o resultado já está aplicado e commitado no
  `index.html`** — os scripts geradores eram só ferramentas de uma vez.
  Se for necessário regenerar algo parecido (outro lote de semanas, outro
  lote de questões), escreva os scripts de novo seguindo o padrão: ler o
  HTML, normalizar CRLF→LF, fazer substituições por âncora de texto exato
  (com contagem de ocorrências esperada), regravar em CRLF, e validar com
  `node --check`, contagem de tags balanceadas e um contador de LF solto.

## Pendências conhecidas (herdadas + desta sessão)

- Verificação completa edital × cronograma × provas (pedida, interrompida —
  ver seção acima).
- 12 súmulas do STJ em `JURIS` marcadas `conf:false` — agora conferíveis via
  `Jurisprudência/sumulas_stj.md`.
- Regimento Interno do TRT4: vários blocos do manual/cronograma apontam
  "só na lei — o material não cobre" porque o Regimento muda por emenda
  regimental; não há cópia local dele em `Leis/` (a pasta tem CLT, CPC, CF,
  Lei 8.112 e Lei 14.133, mas não o Regimento Interno).
  Confirmar se o usuário tem esse arquivo antes de escrever conteúdo sobre
  ele no material.
- Divergência de gabarito na questão 25 da prova de 2006, marcada
  "conferir" em `RAIOX` (herdada de sessões anteriores).
- Abrir o PR do branch `claude/lei-8112-adicionais` (link acima).

---

# Adendo 2 — 2026-09-21

Continua o adendo de 20/09. Registra tudo o que foi feito depois dele, as
decisões do usuário que **não devem ser reabertas**, os achados que ainda
esperam ação e as armadilhas técnicas encontradas. Com isto dá para retomar
numa janela de contexto limpa.

## Estado do repositório

- Branch `claude/lei-8112-adicionais`, **em dia com o remoto** em `e6f4d45`.
  Depois de `6ddd798`, o próprio usuário commitou e enviou `70d44f0`
  ("Verificado edital minuciosamente") e `e6f4d45` ("Adicionados links para
  questões do Qconcursos"). **Nenhum PR aberto ainda.**
- **Pendente, sem commit** (`index.html` e `sw.js`):
  1. nota "Leitura integral: Leis 6.858/1980 e 5.584/1970" no fim do tópico
     `dpt-execucao` e link da Lei 6.858 na lista de fontes de Processo do
     Trabalho;
  2. simulados de sábado com provas reais (ver abaixo);
  3. `CACHE` do `sw.js` em **`autos-do-estudo-v10`** — já cobre os dois itens.
     O `e6f4d45` saiu com v9; sem subir a versão, quem já abriu o app
     publicado continuaria vendo a versão antiga.
- Números atuais: **514 questões**, **154 blocos** em 13 semanas, **64
  tópicos** no material, **185 enunciados** em `JURIS` (nenhum `conf:false`).
- `HANDOFF-projeto.md` agora é versionado no branch; no checkout principal
  (branch `main`) continua não versionado.

## O que foi feito desde o adendo de 20/09

**Barras "Contra a meta da fase" (página 03).** Cinco correções:
`numeroDaData()`/`faseDaData()` fazem cada simulado ser medido pela meta da
fase em que foi feito (antes, todos contra a meta de hoje); `barraMeta()`
escreve "linha de base" quando a fase não tem meta; `opcoesDoRecorte()` usa
a mesma base de `chavesDoPlacar()` (a semana 1 sumia do seletor); aviso
"Falta a linha de base" quando não há simulado da semana 1; texto da regra
de corte alinhado ao atual (RLM das terças + questões de Português das
segundas, nunca a teoria de sábado).

**Cobertura do edital.** Passe exaustivo com 453 termos do Anexo II: a
cobertura expressa no cronograma/manual foi de 38% para **98%**. Cada linha do
manual 03.1 ganhou uma linha "Edital:" (`span.op-edital`) com os itens do
Anexo II que cobre. Sete blocos foram desdobrados no mesmo horário
(`s4-dpc2`, `s5-dt2`, `s6-dt2`, `s7-da2`, `s8-da2`, `s10-da2`, `s13-dt2`),
seis âncoras de "ver no material" foram corrigidas e, na semana 12 de
Legislação, a Lei 12.527 (programa da Área Administrativa) deu lugar à
Resolução CNJ 400/2021.

**Caderno e peso.** Conferido no caderno real de 2022: Gerais = questões
1–30 (Português 15, RLM 5, Legislação 10), Específicos = 31–60. Pelos itens
9.4 e 9.5 do edital de 2022, **Específicos pesa 2 e Gerais pesa 1**; a
discursiva entra somada, sem peso. O app dizia "Redação peso 2" — corrigido.
Novas constantes `CADERNO`, `pesoNaNota()` e `ORDEM_PESO`; a tabela por
disciplina tem as colunas "Caderno" e "Peso na nota". Direito Administrativo
aparece nos dois cadernos (5 + 5), porque cinco questões de Lei 8.112, 14.133
e 9.784 caíram no caderno de Legislação. `COTA_SIMULADO` ficou como estava,
porque é temática e correta.

**Discursiva.** Link da notícia do TRT4 de 13/08/2026 anexado à justificativa
"Estudo de caso", na página 03.

**Súmulas do STJ.** As 12 marcadas `conf:false` foram conferidas contra
`Jurisprudência/sumulas_stj.md`: 11 idênticas; a 650 passou a reproduzir a
grafia oficial ("caraterizadas", "art. 132").

**QConcursos por bloco.** `QC_BLOCO` mapeia 118 blocos para
disciplina/assunto, curados à mão e testados um a um. O filtro da banca FCC é
`examining_board_ids[]=1`. Links no rodapé dos blocos (página 03) e em cada
linha do manual (`a.op-qc`). Dez blocos de Legislação ficam sem link de
propósito: o QConcursos não tem assunto para Lei 11.416, Regimento Interno do
TRT4 nem Lei 7.701.

**Processo Civil.** Seis tópicos novos (`dpc-normas`, `dpc-atos`,
`dpc-procedimento`, `dpc-provas`, `dpc-precedentes`, `dpc-especiais`), além do
`dpc-teoria`. São **82 trechos de lei copiados literalmente de
`Leis/CPC.html`**, com fidelidade conferida por script e inserção provada por
subtração. Foram reapontados 7 blocos, 12 questões do banco e 7 do `RAIOX`;
"só na lei" caiu de 12 para 9.

**Simulados com provas reais (pendente de commit).** Das semanas 5 a 13, o
simulado de sábado é uma prova de Analista Judiciário – Área Judiciária
aplicada pela FCC em outro TRT e resolvida no QConcursos, só nas questões do
programa do TRT4:

| Semana | Prova | Válidas | Bloco crítico |
|---|---|---|---|
| 5 | TRT-14 2022 | 50/60 | 12 |
| 6 | TRT-18 2023 | 53/60 | 10 |
| 7 | TRT-22 2022 — regra de corte | 53/60 | 15 |
| 8 | TRT-12 2023 | 49/60 | 13 |
| 9 | TRT-5 2022 | 52/60 | 15 |
| 10 | TRT-20 2024 — pico | 52/60 | 15 |
| 11 | TRT-17 2022 | 62/70 | 13 |
| 12 | TRT-9 2022 | 55/60 | 15 |
| 13 | TRT-2 2025 | 48/60 | 14 |

Reservas: TRT-21 2023, TRT-15 2025, TRT-23 2022, TRT-7 2024, TRT-6 2025 e
TRT-1 2025. O TRT4 2022 ficou de fora porque o aluno fez essa prova.

No código: `SIM_REAL`, `SIM_RESERVA`, `simRealDoBloco()` e `provaPorSlug()`,
logo antes de `urlQcDoBloco()`. Na página 03, um formulário de registro de
simulado externo (`#simProva`, `#simData`, `#simAc`, `#simTot`, `#simCritAc`,
`#simCritTot`, `#btnRegistrarSim`), que preenche válidas, bloco crítico e a
data do sábado. A janela `dlgRemoverSim` remove um registro externo, sempre
com confirmação. A regra de corte passa a usar o bloco crítico do simulado da
semana 7 (`simuladoComCriticoDaSemana(7)`); sem esse registro, vale o placar,
como antes. No manual, os cartões das semanas 5 a 13 ganharam o quadro
`div.op-simreal` (prova, o que pular, composição do bloco crítico), o P13 e a
grade de sábado foram ajustados, e há um novo aviso "Atualização de
21/09/2026 — vale a partir de 28/09 (semana 5)". A página 06 ganhou a tabela
completa. Os registros externos vão para a **mesma** chave
`historicoSimulados`, com campos opcionais
(`origem:'externo', id, rot, prova, critAc, critTot`); os registros antigos
`{data, acertos, total}` continuam valendo como simuladão do app.

## Decisões do usuário — não reabrir

- A discursiva do próximo concurso é **Estudo de Caso** para AJAJ e Oficial de
  Justiça (fonte: `https://www.trt4.jus.br/portais/trt4/modulos/noticias/51064882`,
  de 13/08/2026). A mesma notícia traz cotas de 30% e correção da discursiva
  até a 800ª colocação — ainda não registradas no app; foi oferecido.
- Português e RLM: o aluno **gabaritou** em 2022, por isso ficam só como
  revisão.
- Regimento Interno do TRT4: fica "só na lei" (muda a cada gestão; o aluno tem
  o PDF vigente).
- Carga semanal fixa em **23h25** — nada de tempo novo.
- Leis 6.858/1980 e 5.584/1970: só dizer quando estudar, sem transcrever.
- Transpor artigos para o material é permitido **com garantia de fidelidade e
  de não perda** (método em `memory/appestudos-transpor-lei.md`).
- Mudança de grade vale a partir da segunda-feira seguinte; semanas já
  estudadas não são reescritas.

## Achados ainda sem ação

1. **Formato atual do estudo de caso** (editais de TRT-1, TRT-2 e TRT-15 de
   2025, baixados com autorização): 1 questão prática (2 no TRT-15), nota de
   0 a 10, mínimo 6,00, **até 15 linhas** (30 no TRT-2), sem consulta, temas de
   Conhecimentos Específicos. O treino de sexta do app (cinco passos, uma hora
   por caso, sem limite de linhas) está desalinhado. **Próximo passo
   sugerido:** pedir autorização para baixar os **cadernos de prova** de TRT-1,
   TRT-2 e TRT-15 2025, onde devem estar os 4 casos reais. Se o ajuste sair
   esta semana, ainda pode entrar no aviso de 28/09.
2. **Dois modelos de prova na FCC em 2025.** Objetivas de 0 a 10, sem nota
   padronizada, com média ponderada de pesos 1+2 (30+30, TRT-1) ou 1+3
   (20+40, TRT-2 e TRT-15). A nota final soma objetiva e estudo de caso, que
   assim pesa perto de metade. O app modela o TRT4 de 2022 (30+30, pesos 1 e
   2). Revisar `CADERNO`, `PESO_*` e os textos quando sair o edital de 2026.
3. **"Zerar progresso" não apaga no navegador embutido.** O evento `close` do
   `<dialog>` não dispara ali; a janela nova de remover simulado já age no
   clique do botão. Foi criada uma tarefa separada para aplicar o mesmo
   conserto ao `dlgZerar`.
4. Recalibrar o índice de incidência e os selos com as 16 provas recentes da
   FCC (item 3 da revisão do professor) — ainda não pedido.
5. Ampliar as OJs do TST: Processo do Trabalho tem só 3 da SDI-1 e 2 da
   SDI-2; Direito do Trabalho, 4 da SDI-1 (item 4) — ainda não pedido.
6. Abrir o PR do branch.
7. Herdadas: divergência de gabarito da questão 25 de 2006 no `RAIOX`.

## Armadilhas técnicas encontradas

- **Service worker em teste:** depois do primeiro carregamento, ele serve o
  `index.html` do cache. Antes de retestar, desregistrar o SW e apagar os
  caches. Em publicação, subir sempre o `CACHE` do `sw.js`.
- **Navegador embutido:** `dialog.close` não dispara evento `close` — ações de
  janela modal devem rodar no `click` do botão.
- **QConcursos:** `fetch` pelo Node leva 403 (Cloudflare); pelo navegador
  embutido funciona. A página de questões de uma prova vem no HTML de
  `/provas/<slug>/questoes?page=N` (20 por página; ao passar do fim, repete).
  `institute_ids[]` é órgão, não banca.
- **Planalto:** `curl` funciona nas páginas das leis (6.858 e 5.584
  conferidas).
- **Guarda do worktree:** edição direta de arquivo na pasta principal é
  bloqueada. Editar a cópia do worktree e copiar com `cp`, conferindo com
  `diff` (é assim que este HANDOFF é sincronizado).
- **Regras de preservação do progresso** (app publicado no GitHub Pages): nunca
  renomear nem remover `id` de bloco, `id` de questão, nome de disciplina ou
  `CHAVES`; só acrescentar.

## Ferramentas desta sessão

Ficam no scratchpad da sessão
(`C:\Users\thale\AppData\Local\Temp\claude\C--Users-thale-Documents-GitHub-AppEstudos--claude-worktrees-questoes-historico-in39-139338\987bfdd2-305d-4b53-8bfb-e15c943f2553\scratchpad\`),
que **pode não existir numa sessão nova**. Se faltarem, recriar pelo mesmo
método:

- `checar2.js` — CRLF, sintaxe dos scripts, ids duplicados e não regressão de
  ids e chaves contra `6ddd798`;
- `conferir_fidelidade.js` — os 82 trechos do CPC contra `cpc_artigos.json`;
- `frases.js` — cobertura do edital por expressão;
- `lei.js`, `cpc_extrair.js`, `gerar_dpc.js`, `topicos_dpc.js` — pipeline de
  transposição de lei;
- `edital_map.js`, `qc_map.js`, `sim_real.js` — dados dos mapas aplicados;
- `a01_completo.txt` e `edital2022.txt` — Anexo II de 2022;
- `editais/` — os 8 editais de 2023–2025 em PDF e em texto;
- `backup_antes_*.html` — cópias do `index.html` antes de cada lote.

As memórias em `C:\Users\thale\.claude\projects\C--Users-thale-Documents-GitHub-AppEstudos\memory\`
persistem entre sessões e resumem o essencial: `provas-fcc-trt-recentes`,
`appestudos-transpor-lei`, `fontes-jurisprudencia-acesso` e
`aluno-diagnostico-trt4`.

## Como retomar

1. Perguntar ao usuário se commita o que está pendente (nota das leis curtas e
   simulados reais, cache v10).
2. Seguir com o achado 1 (estudo de caso), que depende da autorização para
   baixar três cadernos de prova.

# Adendo 3 — 2026-09-21 (estudo de caso)

## Estado do repositório

- O usuário commitou e enviou o que o Adendo 2 dava como pendente:
  `2976607` ("Provas da FCC como simulados", com cache v10). Branch
  `claude/lei-8112-adicionais` em dia com o remoto nesse commit.
- **Pendente, sem commit** (`index.html` e `sw.js`): o novo treino de estudo
  de caso, descrito abaixo, com `CACHE` do `sw.js` em
  **`autos-do-estudo-v11`**. Diff: `index.html` +211/−44 linhas.
- Números: 514 questões, 154 blocos (nenhum id novo), 64 tópicos, 185
  enunciados em `JURIS` — nada disso mudou.

## O que foi feito — estudo de caso no formato da FCC (vale da semana 5)

**Fonte.** Com autorização do usuário, foram baixados do QConcursos os
cadernos de prova e os gabaritos de AJAJ de TRT-1, TRT-2 e TRT-15 (2025):
`https://arquivos.qconcursos.com/prova/arquivo_prova/<id>/<slug>-prova.pdf`
(ids 132832, 137629 e 130569; `curl` funciona, sem Cloudflare). Estão em
`scratchpad/provas2025/`, com o texto extraído por `pdftotext -enc UTF-8
-layout`. A FCC **não publica espelho** (nem no gabarito, nem no site
`concursosfcc.com.br/concursos/trt1r124` e `trt2r124`); ele só aparece na vista
de prova. Dos 8 editais consultados (2023–2025), só TRT-15, TRT-1 e TRT-2 têm
estudo de caso para AJAJ; TRT-6 2025, TRT-7, TRT-11, TRT-20 (só OJAF) e TRT-21
tiveram redação.

**Os quatro casos reais:** TRT-1 — jornada de 6 h estendida e intervalo de
15 min (pedia a Súmula 437); TRT-2 — ação rescisória sem certidão de trânsito,
revelia e cumprimento da sentença (Súmulas 299 e 398, art. 969 do CPC; 30
linhas); TRT-15 Q1 — recurso adesivo (Súmula 283); TRT-15 Q2 — ação popular,
legitimidade de estrangeiro e isenção de custas (CF, art. 5º, LXXIII; art. 14,
§ 2º). Três dos quatro pediram "o entendimento sumulado do TST".

**Achado importante:** o TST **cancelou a Súmula 437 em 30/06/2025** (Res.
225/2025) para fatos desde 11/11/2017 — depois da prova do TRT-1. O caso C9
foi adaptado para pedir a CLT em vigor (arts. 71, § 4º, e 611-A, III), e o
espelho explica por quê. `JURIS` já marcava a 437 como superada.

**No app:**
- **Manual 03.1, seção 6:** quadro `div.op-caso` (id `op-caso-s5` …
  `op-caso-s13`) em cada cartão das semanas 5 a 13, entre os enunciados da
  semana e o `op-simreal`. Enunciado e espelho em `<details>` **fechados**
  ("abra às 17h30" / "abra às 18h10"), pela regra de não dar pista antes da
  resposta. Casos: C5 audiência (art. 844), C6 transferência (art. 469, Súm.
  43, OJ 113), C7 preparo em recuperação judicial (art. 899, § 10, OJ 140,
  teses 271 e 283), **C8 real** TRT-15 Q1, **C9 real adaptado** TRT-1, C10
  garantia da execução (arts. 882 e 884, OJ 59 SDI-2), **C11a real** TRT-2 e
  **C11b real** TRT-15 Q2, C12a gestante em contrato de experiência (ADCT 10,
  II, "b", Súm. 244, tese 163), C12b responsabilidade do Estado (CF 37, § 6º,
  Tema 940). Semana 13: refazer os dois de nota mais baixa.
- Cada espelho tem "O que a resposta precisa ter", "Textos para conferir"
  (**52 trechos literais**, conferidos contra Planalto e TST) e "Onde revisar"
  (links `data-ir`). Atalhos "página 04.2" (`data-j-id`) para os 9 enunciados
  que existem em `JURIS`.
- **P11 e P12** reescritos no padrão "Até a semana 4 / Desde a semana 5". Novo:
  40 min por caso (semanas 5–10) ou dois de 30 min (11–13), folha de 15
  linhas; conferência com o espelho 18h10–18h30; régua nova de 5 critérios ×
  0–2 (itens respondidos, fundamento, aplicação, limite e foco, português);
  reescrita da resposta inteira. A régua e a lista antigas continuam visíveis
  para a semana 4 (sexta 25/09).
- Trilho de sexta (`op-dia-5`), linha da tabela de cada semana, títulos de
  `s5-caso` … `s13-caso` no `CRONOGRAMA` (**`anc` agora `null`**, ids
  intactos), nova tabela "A meta do estudo de caso" (6 → 7 → 8) na seção 2,
  novo aviso "Atualização de 21/09/2026 — estudo de caso — vale a partir de
  28/09 (semana 5)".
- **Página 03:** tabela "O formato da FCC em 2025", coluna "Desde a semana 5,
  onde fica" nos cinco passos, macete "Na folha de 15 linhas" (usa `<strong>`,
  porque todo `<b>` dentro de `.macete` vira rótulo em bloco), quatro cartões
  de fase e macete "De onde vêm os casos". Também corrigidos: cartão ×2 da
  página inicial, macete "Por que Processo do Trabalho rende em dobro",
  tabela "O que a prova cobra" (dizia "Peso 2" para o estudo de caso) e o
  módulo de sustentação.

**Verificação feita:** fidelidade dos 52 trechos (dados e arquivo gravado),
com teste negativo; inserções provadas por subtração; aplicador reproduz o
`index.html` byte a byte a partir de `backup_antes_casos.html`; sintaxe dos
scripts; ids de bloco, de questão, disciplinas e `CHAVES` sem perda; teste de
atualização na mesma origem (estado gravado na versão do HEAD, aberto na nova:
as três chaves `trt4:` idênticas e os 13 blocos marcados preservados);
375 px sem rolagem horizontal nas 10 páginas; console sem erros; os 9 atalhos
para a 04.2 filtram o enunciado certo.

## Peso do estudo de caso — o que se sabe

Nos editais de 2025, a nota final **soma** o estudo de caso (0 a 10) à nota
objetiva. No TRT-15 a objetiva é a média ponderada de 0 a 10, então o estudo
de caso é **metade**. No TRT-1 e no TRT-2 o texto diz "soma das notas
ponderadas" das objetivas mais o estudo de caso — pode ser metade ou um quarto.
O app diz exatamente isso. Para resolver, seria preciso baixar a lista de
resultado com as notas finais (`1_habs_obj_disc_definitivo_class.pdf` nas
páginas da FCC) — **não baixado**: não estava na autorização e tem dados
pessoais; só usar agregados, se o usuário autorizar.

## Ferramentas novas no scratchpad

- `lei_extrair.js` — extrai artigos vigentes do HTML do Planalto: descarta
  `<strike>` **e** `<span style="text-decoration:line-through">` (o Planalto
  usa os dois), aceita "Art. 611-A". Saídas em `leis/clt.json`, `cpc.json`,
  `cf.json`, `l4717.json`. Planalto por `curl` (CLT e Lei 4.717 baixadas).
  Armadilha: `limpar()` do `lei.js` corta em "Capítulo IV" no meio do texto
  (art. 836 da CLT) — o conferidor usa `junta()`, que não corta.
- `casos.js` (dados), `gerar_casos.js` (HTML dos quadros),
  `aplicar_casos.js` (aplicação em duas etapas), `conferir_casos.js`
  (fidelidade; `node conferir_casos.js index.html` confere o gravado). TST:
  súmulas e OJs em `fontes/tst.json` só até "Histórico:" (senão casa com a
  redação antiga); teses vinculantes em `fontes/tst_precedentes.json`
  (215 temas).
- A CLT em `Leis/CLT - 15.06.26.pdf` é edição comercial com "redação
  simplificada nos números" — **não serve para citação literal**; usar o
  Planalto.

## Como retomar

1. Perguntar se commita o estudo de caso (index.html + sw.js v11).
2. Pendências que continuam: dlgZerar (tarefa separada), recalibrar
   incidência com as 16 provas, ampliar OJs do TST, abrir o PR, 30% de cotas e
   correção até a 800ª no app, questão 25 de 2006 no RAIOX, confirmar o peso
   do estudo de caso quando sair o edital do TRT4 de 2026.

# Adendo 4 — 2026-09-21 (peso, incidência, OJs, PR e "Zerar progresso")

## Correção do que os adendos anteriores diziam

- **PRs:** o `main` já tinha recebido este ramo pelos **PRs #4 e #5** (até
  `e6f4d45`). Os adendos 2 e 3 diziam "nenhum PR aberto", o que estava errado.
  Os PRs são criados pelo link de comparação do GitHub
  (`compare/main...claude/lei-8112-adicionais?quick_pull=1&title=…&body=…`):
  o `gh` não está instalado nesta máquina, e o navegador embutido não tem
  login no GitHub (e não se faz login por ele).

## Estado do repositório

- `24ac7a4` — "Estudo de caso da FCC, incidência recente e OJs do TST"
  (commitado e enviado nesta sessão, com autorização do usuário para o PR).
- Commit seguinte — "Zerar progresso: apagar no clique de Confirmar", com este
  adendo.
- PR novo: título "Estudo de caso da FCC, provas reais nos simulados,
  incidência recente e OJs do TST". Link pronto em `scratchpad/pr_url3.txt`,
  descrição em `scratchpad/pr_corpo3.md`. **O usuário precisa abrir o link
  logado no GitHub e clicar em "Create pull request".**
- Cache do `sw.js`: **v11** (o app ainda não foi publicado com ele).
- Números: 514 questões, 154 blocos, 64 tópicos, **220 enunciados** em `JURIS`
  (203 literais conferidos, 17 sínteses).

## Decisões do usuário nesta rodada — não reabrir

- **Peso:** fica como no TRT-15 — o estudo de caso vale **metade da nota
  final** (nota objetiva de 0 a 10 + estudo de caso de 0 a 10). Qualquer
  critério para o TRT4 é especulação até o edital. **Só o peso do estudo de
  caso** muda; as objetivas continuam com a composição e os pesos de 2022
  (30 + 30, pesos 1 e 2), que são a base da distribuição da carga. Não baixar a
  lista de resultado da FCC para "confirmar" o peso.
- Achados do Adendo 2 dados por resolvidos: formato do estudo de caso e
  modelos de peso.

## O que foi feito

**Peso do estudo de caso.** Os textos que diziam "entre um quarto e metade"
(página 03, manual seção 2) agora dizem "metade da nota final no modelo do
TRT-15, adotado como referência".

**Incidência recalibrada** (item 3 da revisão do professor).
- Coleta pelo navegador embutido no QConcursos: 16 provas de AJAJ da FCC em
  outros TRTs (2022–2025), 990 questões, disciplina e assuntos de cada uma
  (`/provas/<slug>/questoes?page=N`; `fetch` do Node leva 403, e envio da
  página para um servidor local é bloqueado — os dados saem por
  `javascript_tool`).
- Mapa assunto do QConcursos → tópico do material curado à mão
  (`scratchpad/qc_incid_map.js`, 324 chaves; fora do programa: Civil,
  Informática, regimentos de outros TRTs, juizados, CCP, OIT, partidos,
  probabilidade, geometria). 760 das 990 questões caem no programa. Validado na
  prova do TRT4 de 2022: 44 de 52 questões no mesmo tópico do `RAIOX`.
- Totais em `scratchpad/qc_incidencia_agg.json`. No app: constante
  `FCC_RECENTE` (logo depois de `ASSUNTOS`), função `montarFccRecente()` (logo
  depois de `montarTabAssunto()`), seção `#fcc-recente` na página 02 (tabelas
  `#tabFcc` e `#tabFccDisc`), e **segundo selo** "FCC recente N/16" em cada
  tópico (`span.selos` > `.selo.fcc`, borda tracejada, montado no
  carregamento). Escala: vermelho 13–16, amarelo 9–12, azul 5–8, cinza 1–4.
  "Comparação" = diferença de 2 níveis de cor ou mais. Sem segundo selo:
  `leg-trt4`, `adm-pad` e `dpc-teoria` (explicado na legenda).
- Ordem de revisão nas semanas 11 (Administrativo) e 13 (revisão geral):
  "tópicos com selo vermelho em qualquer dos dois selos primeiro".
- Mudanças fortes: sobem Poder Judiciário (2/4 → 15/16), crase/concordância,
  segurança do trabalho, organização do Estado, teletrabalho, 14.133,
  princípios e prescrição, custas, atos processuais do CPC. Caem Lei 9.784
  (4/4 → 7/16), ortografia e proposições lógicas (3/4 → 1/16).

**OJs do TST** (item 4). 35 novas em `JURIS` (`scratchpad/ojs_novas.js`,
aplicadas por `aplicar_ojs.js`, que confere texto literal, cancelamento, ids,
âncoras e o teto de 18 por semana). 18 no plano (semanas 5 a 12, prioridade 1
ou 2) e 17 só consulta (prioridade 3, `bloco: null`). Ficaram de fora: OJs
377, 355 e 383 da SDI-1 (canceladas — **atenção: `tst.json` marca
`cancelada: false` para as canceladas "por perda de eficácia" pela Res.
225/2025; olhar o cabeçalho**), OJ 247 da SDI-1 (STF, Tema 1.022) e OJ 153 da
SDI-2 (o app já tem a tese vinculante 75). O parágrafo da página 07 que
contava os enunciados foi atualizado (220; STJ conferido em 20/09).

**Correção de estilo encontrada no caminho:** `.macete b` e `.pegadinha b`
transformavam **todo** negrito em rótulo em bloco; 128 dos 291 quadros tinham
negrito no meio da frase (inclusive as notas da 04.2). Agora a regra vale só
para `> b:first-child`.

**"Zerar progresso"** (feito por último, como pedido). O zerar passou para o
clique de `#btnZerarConfirma`; o `close` só atualiza o resumo (se não houve
zerar) e devolve o foco, com a marca `zerouAgora` para não apagar a mensagem
"Progresso zerado" quando o `close` chega atrasado. Testado no navegador
embutido: Cancelar e Esc mantêm os dados; Confirmar apaga as chaves `trt4:`;
o `close` ali chega com atraso ou não chega. A sugestão de tarefa separada
criada na sessão anterior foi retirada.

## Armadilhas novas

- **Capturas de tela do painel** saem em pixels do dispositivo (fator 1,25 ou
  2) e recortadas; não servem para julgar se algo passa da borda. Conferir
  pela geometria (`getBoundingClientRect`) e por `scrollWidth`.
- **Busca por texto (`find`) falha** em páginas grandes do app; usar
  `javascript_tool`.

## Pendências

- Abrir o PR pelo link (usuário).
- Herdadas: 30% de cotas e correção até a 800ª no app (oferecido, não pedido);
  questão 25 de 2006 no `RAIOX`; rever `CADERNO`, `PESO_*` e o estudo de caso
  quando sair o edital do TRT4 de 2026.

---

# Adendo 5 — 2026-09-21 (material × manual 03.1: quadro "Lei seca")

## Estado do repositório

- `b09399b` e anteriores já estão no `main` (PR criado e mergeado pelo
  usuário).
- Alterações desta rodada **não commitadas** em `index.html` e `sw.js` (cache
  **v12**). O usuário commita e envia.
- Números: 514 questões, 154 blocos, 64 tópicos, **225 enunciados** em `JURIS`.

## O pedido e a resposta

O usuário notou que a linha da semana 4 "Provas e ônus da prova; audiência"
(CLT 818–830 e 843–852; CPC 369–380) dizia "O material basta" e o tópico
`dpt-atos-prazos` não trazia esses artigos. **Não foi proposital:** as marcas
da seção 6 do manual foram dadas por tópico, sem conferir artigo por artigo.
A auditoria (`scratchpad/auditar_manual.js`) achou **55 das 107 linhas "O
material basta"** com artigos ausentes (884 artigos).

## O que foi feito

**Quadro "Lei seca"** no fim do `div.conteudo` de **43 tópicos**
(`div.lei-seca#ls-<tópico>`, com uma caixa `div.lei` por lei): **1.082
artigos** em texto integral do Planalto — os que faltavam nas linhas "basta" e
as leis curtas citadas inteiras (Lei 9.868, Lei 9.882…). Quatro artigos entram
só em parte, com "(trechos pedidos no cronograma)" na referência: CF 102, I, a;
CF 7º, IV, VIII e XVII; CLT 884, § 1º; Lei 5.584, art. 2º, §§ 3º e 4º.
Adaptações declaradas no próprio quadro: saem as notas de alteração e os
dispositivos revogados ou vetados; "Art. N —" no rótulo. Resultado: **0 artigo
ausente** nas 107 linhas "basta".

Scripts (no scratchpad): `lei_extrair.js` (Planalto → JSON por artigo),
`lei_seca_texto.js` (limpeza e divisão em dispositivos), `gerar_lei_seca.js`,
`conferir_lei_seca.js` (cada linha é trecho contíguo do texto oficial **e**
alinhamento palavra por palavra: todo trecho oficial ausente tem de ser nota,
revogado ou rótulo — 0 falha em 1.082 artigos e 4.177 linhas; o teste
negativo pegou palavra apagada e a perda simulada da CLT 158),
`aplicar_lei_seca.js` (inserções provadas por subtração).

**Outros erros achados na validação e corrigidos:**
- Linhas do manual: IN 39, art. 6º (revogado em 2018 pela IN 41) → CLT 855-A;
  Súmulas 268, 294 (S7) e 90, 437 (S9) do TST marcadas como canceladas em
  2025; SVs da semana 13 trocadas para 4, 10, 22, 23, 25, 40 e 53 (6, 33 e 57
  não eram de processo do trabalho); FGTS com os artigos (15, 18, 19-A, 20,
  26); LEF como subsidiária (art. 889 da CLT), não leitura; duas linhas
  deixaram de dizer "sem tópico próprio".
- `JURIS` +5 (prioridade 3, `bloco: null`): Súmulas 457 e 327 e OJ 143 da
  SDI-1 (vigentes); Súmulas 268 e 294 (`superada`, nota apontando o art. 11,
  §§ 2º e 3º, da CLT).
- FGTS no material: depósito até o **dia 20** (Lei 14.438/2022), não dia 7.
- Legendas do manual: "O material basta" cita o quadro Lei seca; "Material +
  leitura da lei" apontava para um "bloco de leitura seca" inexistente — agora
  diz "no mesmo bloco, pelo P3".
- P2: o quadro Lei seca entra no passo 3 (segunda leitura); regra de parada do
  P2 absorve o excesso — **sem tempo novo**.
- CSS: `.lei-seca .lei-txt{overflow-wrap:anywhere}` — leis que alteram outras
  trazem carreiras de pontos ("......") que estouravam 375px.
- Aviso datado "Atualização de 21/09/2026 — material de estudo — vale a partir
  de segunda-feira, 28/09 (semana 5)". Quadros das semanas 1 a 4 vão para a
  revisão geral da semana 13.

## Verificação feita

`checar2.js` (CRLF, scripts, ids, não regressão contra `6ddd798`: nenhum id de
bloco/questão/disciplina perdido, `CHAVES` iguais); `conferir_lei_seca.js
index.html` (0 falha, igual ao manifesto); `auditar_manual.js` (0 ausente);
`conferir_casos.js` (52 trechos, 0 falha). Navegador: 43 quadros dentro de
tópicos, nenhum id duplicado, 375px sem rolagem lateral nas 10 páginas com
todos os `<details>` abertos, console limpo.

## Armadilhas novas

- **Planalto é windows-1252**, não latin1 (0x96 é travessão). CRLF no HTML
  baixado; "Art." e número às vezes em linhas separadas; a CLT começa em
  "TÍTULO I\nINTRODUÇÃO" (antes vem o decreto-lei). Texto revogado vem em
  `<strike>` **ou** em `<span … line-through>`.
- Notas "(Redação dada…" às vezes não fecham o parêntese: remoção gulosa
  apagou incisos da CLT 158. Só o alinhamento palavra por palavra pegou.
- O arquivo passou de ~2,1 MB para ~3,1 MB.
- `btnSoltarTopico` aparece duas vezes no fonte, mas em dois ramos de template
  JS — não é id duplicado no DOM.

## Pendências

- Commit, push e PR (usuário).
- As de antes continuam.

---

# Adendo 6 — 2026-09-22 (art. 117 da Lei 8.112 e segunda conferência)

## Estado do repositório

- `bba7809` ("Só a lei validado com os artigos") tem o trabalho de 21/09.
- Alterações desta rodada **não commitadas** em `index.html` e `sw.js` (cache
  **v13**). O usuário commita e envia.

## O pedido

O usuário notou que o art. 117 da Lei 8.112 não estava no quadro Lei seca do
tópico `adm-8112`, embora a linha da semana 4 do manual peça os arts. 116 a 142.

**Causa:** o auditor de 21/09 dava o artigo como "transcrito" quando a
referência de uma caixa o citava — a caixa dizia "art. 117 (proibições
selecionadas)" e trazia só o inciso VI. A conferência agora é **dispositivo por
dispositivo** contra o texto oficial (`integral.js`, `escopos.js`,
`auditar_manual.js`): 147 artigos estavam incompletos nas linhas "O material
basta".

## O que mais a segunda conferência achou (tudo corrigido)

- **Extração do Planalto:** 10 artigos vigentes da CLT (154, 177, 178, 180,
  181, 183, 188, 189, 190, 197) escritos "Art. . 189" e 25 do DL 200 ("Art .
  8", "Art\n. 12") não eram reconhecidos; o texto deles grudava no artigo
  anterior (e foi assim para o quadro de `dt-seguranca`). `reextrair.js`
  corrige e prova que os artigos mudados só perderam a cauda.
- **CF × ADCT:** o `cf.json` guardava artigos do ADCT com letra (92-A, 92-B,
  116-A…) como se fossem da CF; três deles estavam no quadro de
  `const-judiciario`. Agora `cf.json` e `adct.json` são separados.
- **Limpeza:** rótulos vazios de revogados/vetados ("§ 3º. § 4º.", "§ 1o § 2o O
  relator", "a); b)."), notas não reconhecidas ("(Parágrafo incluído…)",
  "(Restaurado…)"), pontuação dupla depois de nota, caput grudado no § 1º quando
  o Planalto tacha o fim do caput (CLT 790-B). Regra nova e a armadilha dela:
  rótulo só é "vazio" depois de fim de frase — "no art. 529, § 3º." é remissão
  (quase foi apagada; o conferidor agora olha o contexto).
- **Caixas originais do material:** 90 parágrafos não eram literais
  (`conferir_caixas.js`). Corrigidos palavra por palavra (`corrigir_caixas.js`
  + `sobrepor.json` para 23 casos escritos à mão; `aplicar_caixas.js` prova que
  a troca é reversível). Regras erradas ou desatualizadas entre eles: CF 37,
  XVI, "b" (EC 138/2025: "de qualquer natureza"); CF 115 (setenta anos, EC
  122/2022); Lei 8.112, art. 13 (a posse por nomeação é o § 4º); art. 117, VI
  ("pessoa estranha à repartição"); CLT 790-B (ADI 5766, trecho tachado);
  teletrabalho "ou trabalho remoto"; Lei 8.213, arts. 19 e 22 (empregador
  doméstico); CLT 396 (adoção); LGPD, art. 5º, VIII (Agência).
- **Resolução CNJ 400/2021:** o tópico `leg-outros` a descrevia como política de
  segurança da informação; ela é a **política de sustentabilidade** (texto em
  atos.cnj.jus.br/atos/detalhar/3986). Seção reescrita com caixa literal (12
  linhas conferidas). Linhas do manual: S12 listava a Lei 12.527 (fora do
  edital) → Resolução 400; S11 deixou de citar a resolução.
- **ANPD:** Lei 15.352/2026 → Agência Nacional de Proteção de Dados, vinculada
  ao MJSP. Tópico, página 02 e explicações atualizados; enunciados de prova
  intactos. Questão CO26 (acumulação, 2015): explicação avisa a EC 138/2025.
- **CSS:** `@media (max-width:600px){ .lei-txt .lei-alt{white-space:normal} }`
  (notas longas estouravam 375px).
- Aviso de 21/09 "completado em 22/09", com os números novos: **44 tópicos,
  1.223 artigos** no quadro Lei seca.

## Verificação feita

`conferir_lei_seca.js index.html` (1.223 artigos, 0 falha; rótulo apagado só
depois de fim de frase; teste negativo com a remissão do CPC 833 apagada:
pegou); `auditar_manual.js` (0 ausente e 0 incompleto nas 107 linhas "basta");
`conferir_caixas.js` (178 caixas, 0 divergente; teste negativo pegou troca e
omissão); `conferir_juris_caixas.js` (14 literais conferidas, 1 síntese
declarada); `conferir_nada_perdido.js` (os 1.079 artigos dos quadros de 21/09
continuam completos, exceto os 3 do ADCT); `varrer_residuos.js` e
`regressao_texto.js` (limpeza de todas as leis, 22.422 linhas); `checar2.js`
(nenhum dado gravado perdido); `conferir_casos.js`. Navegador: 44 quadros, art.
117 com 23 linhas, 375px nas 10 páginas, console limpo.

## Pendências

- Commit, push e PR (usuário).
- Não feito: conferir se a referência de cada caixa corresponde ao que ela
  transcreve (ex.: caixa "art. 28" da Lei 14.133 sem o § 1º). O quadro Lei seca
  cobre o que o manual pede, mas a referência de algumas caixas é mais larga que
  o texto delas. **Feito no Adendo 7.**

---

# Adendo 7 — 2026-09-22 (títulos das caixas × texto delas)

## Estado do repositório

- `dfc6e57` (merge do PR #7) está no `main` e publicado: tem o trabalho de
  21/09 (`bba7809`).
- Alterações dos adendos 6 e 7 **não commitadas** em `index.html` e `sw.js`
  (cache **v13**, uma subida só para as duas rodadas). O usuário commita e envia.

## O pedido

"Confira também os títulos das caixas contra o texto delas."

**Regra adotada** (a legenda do material): o título cita exatamente o que a
caixa transcreve. Fora da Lei 11.416, tudo o que está transcrito é citado e vem
em negrito; nas caixas da Lei 11.416, o peso normal é contexto não citado.
Formato: itens separados por "; "; "arts. X a Y" só quando nenhum artigo vigente
do meio fica de fora; "art. N, caput, I a XVII e §§ 4º e 6º"; "parágrafo único";
"(trecho)" quando um dispositivo é cortado com [...]. Decisão: **corrigir o
título para o texto**, não acrescentar texto — o que o manual pede já está no
quadro Lei seca. Exceção: os cortes sem [...] foram completados.

## O que foi feito

- **108 títulos** de caixas corrigidos (ex.: "Lei 8.112/1990 — arts. 13 e 15" →
  "art. 13, §§ 1º e 4º; art. 15, § 1º"). Mais a caixa nova da Resolução 400.
- **8 caixas** com dispositivo citado fora do negrito: negrito completado.
- **8 cortes sem [...]** completados com o texto oficial (ex.: CLT 75-B, § 1º,
  "ou trabalho remoto"; CLT 452-A, "em contrato intermitente ou não").
- **Quadros Lei seca regerados** com título exato (`gerar_lei_seca.js` +
  `formatar_titulo.js`): 44 tópicos, **1.215 artigos** (eram 1.223: saíram
  artigos revogados que entravam por faixa e duplicatas). Nota do quadro diz
  que, quando o título cita incisos/parágrafos, só entram o caput e eles.
- **Defeitos de extração achados pelo conferidor de títulos** (todos
  corrigidos):
  - tachado aninhado (`<strike>` dentro de `<span line-through>`): a redação
    antiga do art. 4º, § 1º, da Lei 11.416 aparecia como vigente. `extrair2.js`
    conta o aninhamento; todas as leis foram reextraídas (backup em
    `scratchpad/leis_bak_22-09/`);
  - títulos de seção grudados no fim de artigos ("SEÇÃO II-A Do Procedimento
    Sumaríssimo" no CLT 852) e cabeçalhos de MP caducada (MP 905). Regra: caixa
    alta sempre corta; título em caixa normal só depois de pontuação final ou
    "de AAAA" — "Título VII" dentro do texto do art. 14 da Lei 605 fez o corte
    errado antes da regra;
  - parágrafo único do CLT 153 duplicado (texto restaurado depois da MP
    caducar) — **estava no publicado**; dedupe só de caput/§ (alíneas repetidas
    são legítimas: CLT 592, CPC 932);
  - CF 117 (revogado) quebrava o gerador: critério de revogado unificado
    (`dispositivos()` vazio). No publicado ele aparecia como a linha solta
    "Art. 117 — e Parágrafo único.";
  - "l" solto numa linha depois do CLT 182 (marcador do Planalto): regra nova
    em `semNotas`; comparada a limpeza antes/depois nas 8.207 entradas de
    todas as leis, só o CLT 182 mudou (`saida_limpeza.js`).
- **Quadros publicados × agora:** dos 1.078 artigos que continuam, 83 mudaram
  de texto — títulos de seção grudados, notas de alteração que escaparam
  ("(Parágrafo incluído…)"), rótulos vazios ("§ 3º. § 4º.", "I -; II -;"),
  ponto duplo, os 10 artigos da CLT grudados, os restos de texto revogado na
  Lei 11.416 (art. 4º, § 1º antigo, e ", observada a seguinte razão:" no art.
  12), L605 14, CLT 153, e o CF 102 com o inciso III pedido. Saíram 4 (3 do
  ADCT e o CF 117). Os 7 artigos vigentes que entraram e saíram dos quadros
  nesta rodada (CLT 66, 166, 189, 194; CF 111; Lei 11.416, 8 e 13) nunca foram
  publicados e estão 100% nas caixas do próprio tópico.
- Aviso de 21/09 ganhou três itens (títulos, cortes, sobras e erros dos
  quadros, com a lista dos cinco erros de conteúdo) e o número novo: "44
  tópicos … 1215 artigos".

## Verificação feita

`conferir_titulos.js` (237 caixas, 74 nos quadros: 0 problema, com cobertura e
negrito exigidos em **100%** — os limiares antigos de 97% e 95% deixavam passar
a última palavra cortada). Teste negativo `neg_titulos.js`: 15 estragos
aplicados um a um, com prova de que o arquivo mudou — título pedindo mais e
menos, negrito faltando (inclusive numa palavra), artigo não citado, corte de
uma palavra, palavra trocada, negrito no contexto da Lei 11.416 (parcial e
inteiro), art. 117 fora do título, inciso e artigo apagados no quadro: **15
acusados**, só na caixa estragada. Demais: `conferir_lei_seca.js` (1.215, 0
falha), `conferir_caixas.js` (178, 0), `auditar_manual.js` (0 ausente, 0
incompleto), `conferir_juris_caixas.js` (0), `conferir_nada_perdido.js` (1.079,
3 exceções do ADCT declaradas), `conferir_casos.js` (52, 0), `checar2.js`
(nenhum dado gravado perdido, `CHAVES` iguais). Navegador: 375px nas 10 páginas
com todos os `<details>` abertos, sem rolagem lateral, console limpo, títulos
renderizados, art. 117 no quadro.

## Armadilhas novas

- O Planalto aninha tachados; regex não guloso para no primeiro `</span>` e
  deixa texto revogado. Contar a profundidade.
- Um teste negativo que troca "a primeira ocorrência" pode acertar o aviso em
  vez da caixa: exigir âncora única e provar que o arquivo mudou.

## Pendências

- Commit, push e PR (usuário).
- As de antes continuam.

---

# Adendo 8 — 2026-09-23 (CPC 125, verificação independente e filtros do banco)

## Estado do repositório

- `51f513a` (adendos 6 e 7) está no `main` pelo PR #8 (`a56ae41`) e publicado,
  com cache **v13**.
- Alterações desta rodada **não commitadas** em `index.html` e `sw.js` (cache
  **v14**). O usuário commita e envia.

## O pedido 1 — "o art. 125 do CPC para no § 1º, mesmo na lei seca"

- **O que o usuário viu era a versão v12** (`bba7809`). Nela o quadro Lei seca
  de `dpc-terceiros` não trazia o art. 125, porque o auditor antigo contava a
  caixa parcial ("art. 125 … [...]") como artigo inteiro. A v13 publicada já o
  traz inteiro, com o § 2º (conferido no site publicado em 23/09).
- **Por que a versão velha aparece:** o `sw.js` serve primeiro o cache. Depois
  de uma publicação, a primeira abertura mostra a versão anterior; a nova só
  aparece na abertura seguinte. Não foi mudado nesta rodada (ver pendências).
- **Verificação independente** (`scratchpad/verif_independente.js`): leitor
  próprio das linhas do manual 03.1 e texto **visível** do tópico inteiro. Cada
  dispositivo oficial pedido tem de aparecer, na ordem da lei. Não usa o
  auditor, o leitor de caixas nem a cobertura. Na v12 ele acusa o CPC 125 (I
  cortado, § 2º ausente) e a Lei 8.112, art. 117.
- **Quatro faltas reais na v13, todas escondidas por defeitos do auditor:**
  1. "§§ 4º e 6º; arts. 39 a 41": a regra que apaga parágrafos comia "39 a 41".
     A CF 39 a 41 não era exigida em `adm-principios` (semana 1).
  2. "852-A a 852-I" e "55-A a 55-L": a remoção de incisos romanos apagava a
     letra final (I, L) e a faixa ficava vazia. Faltavam a CLT 852-B a 852-I em
     `dpt-dissidio` (S5) e a LGPD 55-A a 55-L em `leg-lgpd` (S10).
  3. `escopos.js`: 'CF:37@const-adm' restringia o art. 37 a I–XVII, mas a S7 pede
     "arts. 37 e 38" inteiros. Entrada retirada.
  - Correções em `auditar_manual.js` (`(?<!-)` antes do romano; o ";" fica como
    separador) e `escopos.js`. Agora os dois leitores extraem os mesmos artigos
    em todas as 107 linhas "basta".
- **Quadros regerados:** 44 tópicos, **1.237 artigos** (+22, e o CF 37 inteiro
  em `const-adm`). Aviso de 21/09 "completada em 22/09 e 23/09", com item novo
  das quatro linhas. O item de 22/09 passou a citar o CPC 125.
- LGPD 55-B é revogado: no Planalto o rótulo fica dentro do tachado e só a nota
  "(Revogado pela Lei nº 14.460, de 2022)" sobra, colada ao 55-A. A limpeza a
  retira. A nota de redação do 55-A no Planalto diz "Lei nº 15.452, de 2026";
  as outras seis dizem 15.352. Só aparece em nota retirada.

## O pedido 2 — filtros do Banco de questões

- **Meu histórico** (`#fHist`): "Errei pelo menos uma vez" (`n > ac`) e "Errei
  na última resposta" (último item de `h` com erro), pelo `histQ`
  (`trt4:historicoQuestoes`). A lista é congelada no começo da rodada
  (`novaRodada` → `congelarHistorico`): responder no meio da rodada não tira a
  questão da tela, e o placar "Nesta rodada" conta sempre as mesmas. O aviso
  `#notaHist` diz isso quando o filtro está ligado. `zerarProgresso` congela de
  novo, e a lista fica vazia na hora.
- **Id da questão** (`#formId`, `#fId`, botão "Mostrar esta questão"):
  - aceita maiúsculas ou minúsculas e vários ids (vírgula ou espaço), sem repetir;
    "DT5" vale como "DT05";
  - id que não existe aparece na faixa "Busca por id";
  - limpa os outros filtros; trocar matéria, assunto, ano ou histórico sai da
    busca;
  - "Limpar filtros", simuladão e os atalhos do material e da jurisprudência
    zeram os dois filtros; o texto digitado é escapado.
- **Armazenamento:** nenhuma chave nova. `estado.hist`, `histIds`, `ids` e
  `idsFora` não são gravados. O texto do topo da página 05 cita os filtros.
- **Teste no navegador** (servidor local, perfil de teste):
  - os dois modos do histórico, a lista congelada e a combinação com matéria;
  - os ids em todos os casos acima;
  - "Zerar progresso" com o filtro ligado;
  - atualização: dados gravados antes ficam byte a byte iguais depois de abrir
    a versão nova, e os 12 blocos marcados continuam marcados;
  - 375 px sem rolagem lateral; console limpo.

## Verificação feita

`verif_independente.js`: 1.325 artigos e 5.956 dispositivos, 0 falta. As 22
linhas "não lido" são texto sem artigo. Teste negativo: o § 2º do CPC 125 e o
§ 1º do 55-D apagados do quadro foram acusados por ele e pelo auditor. Também:
- `auditar_manual.js`: 0;
- `conferir_lei_seca.js`: 1.237, 0 falha;
- `conferir_titulos.js`: 237 caixas, 0 problema; o teste negativo pegou os 15
  estragos;
- `conferir_caixas.js`: 178, 0;
- `conferir_nada_perdido.js`: 1.079;
- `conferir_juris_caixas.js`: 0; `conferir_casos.js`: 52, 0;
  `varrer_residuos.js`: nada;
- `checar2.js`: nenhum dado gravado perdido, `CHAVES` iguais.

## Pendências

- Commit, push e PR (usuário).
- Sugerido, não feito: avisar na tela quando o service worker instalar uma
  versão nova ("Há uma versão nova do material — toque para atualizar") e
  baixar os arquivos com `cache: 'reload'` na instalação. Hoje a primeira
  abertura depois de publicar mostra a versão anterior.
- As de antes continuam.

---

# Adendo 9 — 2026-09-23 (voltar ao ponto anterior e balão dos procedimentos)

## Estado do repositório

- `e4fa821` (Adendo 8) está no `main` pelo PR #9 e publicado, com cache **v14**.
- Alterações desta rodada **não commitadas** em `index.html` e `sw.js` (cache
  **v15**). O usuário commita e envia.
- O usuário é o próprio aluno: não quer aviso de versão nova na tela.

## 1. Voltar ao ponto anterior

- Toda ida interna passa por `navegar(acao)`:
  - `abrirPagina`, que é o menu e os links "ver no material";
  - `irParaQuestoes`, `irParaQuestoesJur` e `irParaJuris`;
  - os saltos da página 03.1 (`data-op-ir`, `data-op-dia`, `data-op-sem`);
  - o botão "Ir para a semana atual".
- `navegar` guarda a posição da entrada atual (`history.replaceState`), executa
  a ida e cria uma entrada nova (`history.pushState`). Cada entrada guarda a
  página, o `y` e o ponto de leitura. O ponto de leitura é o elemento com id
  mais interno no alto da tela, ou a ficha da questão, com a distância até ele;
  ficha cortada no alto passa a âncora para a seguinte. No banco, a entrada
  guarda também os filtros; na 04.2, o `jurFiltro`.
- `popstate` → `restaurar`. Se a lista do banco na tela já não é a da entrada,
  os filtros dela são refeitos (uma rodada nova, como qualquer troca de filtro).
  A rolagem é instantânea (`behavior:'instant'`, porque o CSS tem
  `html{scroll-behavior:smooth}`) e desconta o `translateY(6px)` da animação de
  entrada da página.
- A posição é guardada 250 ms depois que a rolagem para;
  `history.scrollRestoration = 'manual'`.
- `abrirPagina` virou `mostrarPagina` (só troca de página) + rolagem.
- **Botão "← Voltar para <página>"** (`#btnVoltar`, fixo embaixo à direita, com
  área segura). Aparece quando a entrada tem `n > 0`. Diz "Voltar ao ponto
  anterior" quando a ida foi na mesma página. É o que funciona no iPad em modo
  web app, que não tem botão de voltar.
- Recarregar abre no Panorama, como antes; o número da entrada e a página de
  origem continuam valendo, então o Voltar ainda leva à entrada anterior.
- Nada é gravado no aparelho.

## 2. Balão dos procedimentos (03.1, seção 3)

- Os `span.op-proc` da seção 3 viram botões (`role`, `tabindex`,
  `aria-expanded`). Os blocos `.op-p` da seção 4 ganham id `op-P1` a `op-P16`
  (atribuído por JS).
- O balão `#opDica` fica dentro de `#pg-operacional` e é uma cópia do bloco da
  seção 4 no momento da abertura. Portanto nunca diverge da seção 4.
- Mouse: abre 150 ms depois de o cursor parar no código; o cursor pode entrar
  no balão e rolar o texto; fecha 250 ms depois de sair.
- Clique, toque ou Enter/espaço: deixa o balão aberto. Fecha com "Fechar", Esc,
  clique fora ou o mesmo código de novo. O foco pelo teclado também abre.
- Posição: abaixo do código, ou acima quando falta espaço; largura até 480 px;
  segue a rolagem. No Safari, o `resize` da barra de endereço reposiciona o
  balão em vez de fechá-lo.
- Link "Abrir o Pn na seção 4 →" (com volta).
- Intro da seção 3 explica o uso. O índice dizia "P1 a P15"; agora diz "P1 a
  P16".

## Verificação feita

Edge sem interface pelo protocolo de depuração (`scratchpad/cdp.js`,
`teste_navegacao.js`, `prints_navegacao.js`), com mouse, teclado e toque de
verdade. O painel do navegador embutido estava oculto, e página oculta não roda
`requestAnimationFrame`.
- **Volta ao ponto exato (diferença de 0 px):**
  - cronograma → material → volta e avança;
  - banco com respostas → material → volta, com a mesma lista e as respostas
    na tela;
  - banco → material → "Resolver agora" → volta, volta: o filtro de antes é
    refeito, e a mesma ficha fica no mesmo ponto;
  - salto do índice da 03.1;
  - 04.2 com o filtro de antes.
- Depois de recarregar, o Voltar leva à entrada anterior.
- **Balão:** os 16 códigos mostram exatamente o texto da seção 4. Passar o
  cursor, entrar no balão, rolar, sair, clicar, Esc, Tab + Enter, "Fechar" e o
  link com volta funcionam. No celular, com toque, o balão abre, segue a
  rolagem e fecha com um toque fora.
- 375 px sem rolagem lateral; console sem erro. O único 404 é o
  `favicon.ico`, que o app não tem.
- Também passaram: `teste_file3.js` (páginas, IN 39, histórico por questão,
  janela de Zerar), `checar2.js` e os conferidores do material.

## Armadilhas novas

- No headless, `element.focus()` não dispara `focusin` sem
  `Emulation.setFocusEmulationEnabled`.
- Edge headless deixa processos filhos presos ao perfil. Use um perfil novo por
  rodada e encerre só os processos com `perfil-headless` na linha de comando.

## Pendências

- Commit, push e PR (usuário).
- As de antes continuam.

---

# Adendo 10 — 2026-09-30 (cobertura do edital, questões, STF e link da FCC)

## Estado do repositório

- Alterações **não commitadas** em `index.html`, `sw.js` (cache **v16**) e neste
  arquivo. O usuário commita e envia.
- A grade nova vale a partir de segunda-feira, 05/10 (semana 6). As semanas 1 a 5
  não mudaram.

## O pedido

1. "Os arts. 284 a 293 do CPC ficaram de fora de propósito?"
   - Foi erro: eles estão no edital (valor da causa e distribuição).
   - O pedido veio junto com a ordem de conferir todos os blocos contra o edital
     de 2022.
2. A CO23 listava menos legitimados do que o art. 103 da CF.
3. Havia questões desatualizadas sobre o adicional de qualificação.
4. Pôr um link para as questões da FCC no material, abaixo do link do banco.

## O que foi feito

### Grade (seção 6 do 03.1, `CRONOGRAMA`, `QC_BLOCO`)

- **Cinco blocos novos**, cada um no horário de outro bloco da mesma
  disciplina:

  | Bloco | Conteúdo |
  |---|---|
  | `s7-da3` | Lei 8.112, arts. 1º a 4º |
  | `s8-dt2` | Lei 6.019, Lei 12.023 e Súmula 331 — marcado "Só na lei" |
  | `s10-da3` | Lei 14.133, arts. 112 a 194 |
  | `s11-dt2` | CLT, arts. 224 a 351 |
  | `s12-dpt2` | CLT, arts. 668 a 709, e LC 75, arts. 85 a 115 |

  Cada um entrou nas listas de revisão R2, R7, R14 e R30 correspondentes.
- **30 linhas** ganharam artigos. Os arts. 284 a 293 do CPC entraram na sexta
  da semana 8. **11 títulos** mudaram no cronograma, no manual e nas listas.
- A linha "direito coletivo" da semana 13 repetia os arts. 223-A a 223-G da CLT
  e os arts. 19 a 22 da Lei 8.213, que já estão na linha "dano" do mesmo
  horário. Eles ficaram só na linha "dano", que agora vai até o art. 23.
- "Lei 9.784/1999 (a lei inteira)" e "Lei 13.146/2015 (a lei inteira)": o
  `verif_independente.js` não lê o formato "arts. X a Y (a lei inteira)".
- **Links corrigidos:**
  - 18 links das listas de revisão apontavam para `dpc-recursos` ou `mat-dpc`;
    agora apontam para `dpc-normas`, `-atos`, `-procedimento`, `-provas`,
    `-precedentes` e `-especiais`.
  - 2 `op-path` vazios (improbidade na semana 8, responsabilidade na semana 10).
- **Nenhum id renomeado ou removido.** Os blocos passaram de 154 para 159.

### Omissões de propósito, fora do edital ou superadas

- **CPC:** 550–673, 682–711, 719–770, 929–946 e 960–965; também 1.045–1.072,
  exceto os arts. 1.046, 1.047, 1.054 e 1.057 (direito intertemporal).
- **CF:** 17, 42–43, 87–91, 106–110, 118–126 e 136–250.
- **CLT:** 352–371, 626–642-A, 722–735 e 903–922; os arts. 736–762 (MPT) foram
  superados pela LC 75.
- **Lei 8.112:** 183–253 (seguridade).
- **Lei 7.701:** 12–16.
- **Quase todo o conteúdo de:** DL 200, DL 3.365, Código Civil, Lei 8.213,
  Lei 11.101 e LC 75.

### Questões

- `scratchpad/aplicar_questoes.js`: 98 trocas em 58 questões. Ids, matérias e
  gabaritos não mudaram.
- A lista completa de achados está em `scratchpad/qv/achados.md`.
- Destaques:
  - **CO23:** a alternativa certa traz os nove incisos do art. 103.
  - **LG07 e LG22:** adicional de qualificação pela Lei 15.292/2025, com
    múltiplos do VR.
  - **DT30:** Lei 14.611/2023.
  - **CO26:** EC 138/2025.
  - **DA37 e DA38:** STF, 2026.
  - **DA43:** ADI 2.975.
  - **PT_T53:** os periciais ficam com a União.
  - **PT14, PT25 e PT42:** tinham duas alternativas defensáveis.

### Material

- **Improbidade:**
  - a lei-nota da prescrição e o § 5º receberam `lei-alt`;
  - caixa `.base` nova, "Atualização jurisprudencial — STF, ADIs 7.156 e 7.236",
    com 13 itens;
  - fontes: noticias.stf.jus.br de 28/05, 24/06, 25/06 e 01/07/2026.
- **ADI 5766:** separados os regimes dos honorários — periciais pagos pela
  União (Súmula 457); sucumbência com condição suspensiva de 2 anos. A mudança
  está na caixa de custas e na lei-nota do art. 791-A.
- **Art. 899, § 4º:** nota das ADCs 58 e 59.
- **CSS:**
  - `.base b` e `.revogado b` viraram `> b:first-child` (antes, todo negrito
    dentro dessas caixas virava rótulo em bloco);
  - novo `.lei-txt .ls-stf`.

### Lei seca

- **Avisos do STF:** `scratchpad/notas_stf.js` tem 33 avisos; 31 são usados, e
  aparecem 35 vezes na página. O gerador põe `<p class="ls-stf">` depois das
  linhas do artigo. O conferidor lê só `<p><b>`, então o aviso não interfere.
- **Cabeçalho:** foi mudado para explicar o aviso.
- **Caput vetado com parágrafo em vigor** (Lei 11.107, art. 10): o gerador
  agora escreve "Art. 10 — (VETADO)". Sem isso, o parágrafo parecia do art. 9º.
- **Números:** 1946 artigos em 44 tópicos. O aviso de 21/09 voltou a dizer 1237.
  O `aplicar_lei_seca4.js` não mexe mais nesse número.
- **`conferir_nada_perdido.js`:** ganhou o mapa `MOVIDO`. Os 12 artigos que
  saíram de `dt-coletivo` são conferidos em `dt-dano`.

### Link da FCC

- **IIFE `injetarAtalhosFcc`**, depois de `injetarAtalhosJuris`:
  - por tópico, os URLs de `urlQcDoBloco` dos blocos com o mesmo `anc`, sem
    repetir;
  - com um link, a barra mostra um botão; com vários, uma lista com o título do
    bloco;
  - nos 3 tópicos sem assunto no QConcursos (`leg-trt4`, `leg-outros`,
    `info-hist`), um texto literal.
- **Posição:** logo abaixo da barra do banco, ou no topo do tópico; a barra de
  jurisprudência fica depois.
- **Por matéria:** um link por disciplina de `QC_DISCIPLINA`. Legislação tem
  dois: `leg` e `dig`.

### Aviso

- "Atualização de 30/09/2026 — vale a partir de segunda-feira, 05/10
  (semana 6)", no topo do 03.1.

## Verificação feita

- **Scripts de edição:** todos com prova por reversão; 0 LF soltos e 0 CR
  soltos.
- **`checar2.js`:**
  - 4 scripts sem erro;
  - nenhum id de bloco ou de questão perdido;
  - nenhuma disciplina perdida;
  - `CHAVES` iguais.
- **Conferência da lei seca:**
  - `conferir_lei_seca.js`, pelo manifesto e pelo HTML: 1946 artigos, 0 falhas;
  - `conferir_nada_perdido.js`: 1079 conferidos, 0 faltando;
  - `verif_independente.js`: só os 22 "NÃO LIDO" que já existiam (comentários
    das linhas).
- **Edge sem interface** (`teste_30-09.js`, `teste_clique2.js`,
  `teste_clique_seq.js`, `teste_file3.js`):
  - **Atualização da versão publicada para a nova,** no mesmo perfil `file://`:
    61 blocos marcados continuam marcados; as 4 chaves `trt4:` ficaram
    idênticas byte a byte; o total passou de 154 para 159.
  - **Barras FCC:** 64 de 64 tópicos têm a barra, em ordem certa; 99 links, 0
    ruins; 8 matérias.
  - **Seção 6:** clique real nos 13 destinos novos ou corrigidos abre o tópico
    certo.
  - **375 px:** sem rolagem lateral.
  - **Console:** sem erro, fora o `manifest.json` em `file://`.

## Armadilhas novas

- **Comentário depois do nome da lei:** o auditor lê
  "Lei 7.783/1989 — os arts. 223-A…" como artigos da Lei 7.783. Não ponha
  comentário com "arts." logo depois do nome de uma lei.
- **Planalto e STF:**
  - trecho tachado removido pode deixar vírgula dupla (CLT 394-A e CF 100,
    § 11); o aviso do STF explica isso;
  - o Planalto nem sempre tacha o que o STF derrubou (Lei 12.016, arts. 7º e 22,
    § 2º; CLT 235-C a 235-E e 702).
- **Cliques seguidos no teste headless** logo depois de trocar de página caem
  durante a restauração da rolagem. Espere cerca de 2,5 s ou recarregue.

## Pendências

- Commit, push e PR (usuário).
- A LBI inteira e a Resolução CNJ 400 não têm assunto em `QC_BLOCO`. Conferir no
  QConcursos se existe assunto próprio antes de associar.

---

# Adendo 11 — 2026-10-01 (tópico do PAD)

## Estado do repositório

- `6e5d159` (Adendo 10) está commitado. Alterações desta rodada **não
  commitadas** em `index.html`, `sw.js` (cache **v17**) e neste arquivo.

## O pedido

"Por que o bloco do PAD não tem lei seca? Ele é enxuto; ponha um elemento
sintetizador com o que as provas cobram e a lei seca dos arts. 143 a 182."

## Causa

O quadro Lei seca só é gerado para linhas "O material basta". A linha da
semana 5 (`s5-da`, Lei 8.112, arts. 143 a 182) estava "Material + leitura da
lei". Outras 14 linhas com artigos têm a mesma marca e também não geram quadro
(semanas 1–4, 5 — Regimento —, 9, 10 e 12); a extensão a elas depende do usuário.

## O que foi feito (`scratchpad/aplicar_pad.js`, com prova por reversão)

- **Tópico `adm-pad`:**
  - mapa em seis etapas (`ol.fluxo`, CSS novo em "Material");
  - tabela dos três ritos;
  - tabela "O que a FCC cobrou";
  - tabela de jurisprudência (SV 5, STJ 343 cancelada, 611, 641, 592, 635,
    591, 672, 674, 650 e 665; STF MS 23.262);
  - pegadinha "O padrão da banca";
  - a frase errada sobre o procedimento sumário foi corrigida (art. 133:
    opção em 10 dias; má-fé leva à demissão).
- **Levantamento:** 20 provas da FCC de AJAJ, 1.230 questões, lidas pelo
  navegador embutido. O `fetch` do Node agora dá 403 (desafio da Cloudflare); o
  `fetch` de dentro da página do QConcursos funciona. Os cartões têm
  `.q-question-breadcrumb`, `.q-question-enunciation` e `.q-item-enum`.
- **Linha `s5-da`:** passou a "O material basta". A lei seca entrou com 38
  artigos (145 e 151 já estão inteiros nas caixas). O total agora é 1984 artigos
  em 45 tópicos.
- **`notas_stf.js`:** ganhou `L8112:170` (STF, MS 23.262 — art. 170
  inconstitucional).
- **`ASSUNTOS`:** PAD estava em `[2011, 2015]`; agora está em `[2011, 2022]`.
  A prova de 2015 não tem questão de PAD; a de 2022 tem a Súmula Vinculante 5.
- **Aviso** "Atualização de 01/10/2026" no topo do 03.1.

## Verificação

- **Scripts de edição:** sem LF nem CR soltos.
- **`checar2.js`:** sem perda de ids nem de chaves.
- **Conferidores:**
  - `conferir_lei_seca.js` (manifesto e HTML): 1984 artigos, 0 falhas;
  - `conferir_nada_perdido.js`: 0 faltando;
  - `verif_independente.js`: só os 22 "NÃO LIDO" antigos.
- **Edge sem interface (`teste_pad.js`):**
  - da versão `HEAD` para a nova, 61 blocos marcados e 4 chaves `trt4:`
    idênticas;
  - o tópico mostra, na ordem: barras, mapa, tabelas e lei seca dos arts. 143 a
    182;
  - 375 px sem rolagem lateral;
  - console sem erro.

## Pendências

- Commit e push (usuário).
- Decidir se as outras 14 linhas "Material + leitura da lei" ganham lei seca.

---

# Adendo 12 — 2026-10-04 (lei seca nas linhas "Material + leitura" e duração de cada etapa)

## Estado do repositório

- `314adcd` (Adendo 11) está commitado.
- Alterações desta rodada **não commitadas** em `index.html`, `sw.js` (cache
  **v18**) e neste arquivo.

## 1. Lei seca nas 14 linhas "Material + leitura da lei"

- **`gerar_lei_seca.js`:**
  - também gera o quadro para linhas `Material + leitura…`;
  - `L4717` foi incluída (o texto já estava em `leis/l4717.json`);
  - a `IN39` fica de fora (`SEM_TEXTO`), porque está inteira na página 04.1;
  - o fecho da lei ("Brasília, 14 de agosto de 2018; …"), grudado no último
    artigo (Lei 9.784, art. 70; LGPD, art. 65), é cortado.
- **Os três conferidores aceitam o mesmo fecho** (`auditar_manual.js`,
  `verif_independente.js` e `conferir_lei_seca.js`).
- **`conferir_lei_seca.js`:** ganhou uma regra para o falso positivo do CF, art.
  29. O "n" de "nº" na nota casava com o rótulo "n)". A regra só se aplica a
  trechos que a lógica antiga já reprovaria.
  - Teste negativo: com estragos em CF 29, LGPD 65, CLT 238 e Lei 9.784, art.
    69-A, todos foram acusados.
- **`notas_stf.js`:** +5 avisos — CPC 46 e 52 (ADIs 5.492 e 5.737), CPC 53
  (ADIs 6.792 e 7.055), CPC 144, VIII (ADI 5.953) e Lei 14.133, art. 75 (ADI
  6.890). São 37 avisos usados.
- **Marcas** (`scratchpad/aplicar_meio.js`):
  - 10 linhas passaram a "O material basta";
  - as 4 que citam norma que não é lei passaram a **"Material + leitura da
    norma"**: S1 (IN 39), S5 (Regimento), S12 PJe (Res. CSJT 185 e IN 39) e S12
    leg-outros (Res. CNJ 400 e Regimento);
  - a legenda da seção 6 e o P3 foram ajustados.
- **Resultado:** 52 tópicos e 2722 artigos.
  - `auditar_manual.js` (normal): 0 ausente e 0 incompleto nas 121 linhas
    "basta";
  - conferidores: 0 falhas;
  - `conferir_nada_perdido.js`: 0 faltando;
  - `verif_independente.js`: só os 22 "NÃO LIDO" antigos.
- **Tamanho:** o `index.html` passou de cerca de 3,9 MB para 4,6 MB.

## 2. Duração de cada etapa (`scratchpad/aplicar_duracoes.js`)

- **Cálculo:** `<span class="op-tempo">` é calculado dos próprios horários,
  nunca digitado, e fica logo abaixo do horário.
- **Seção 3:** os 54 `.op-hora`.
- **Seção 6:**
  - os 146 `td.op-disc`; nos 32 blocos de dois dias, cada horário tem a sua
    duração e uma linha "total";
  - os 70 títulos de revisão, estudo de caso e simulado;
  - as faixas de enunciados (`OP_SLOTS.dur`).
- A introdução da seção 6 explica que a duração vai do início ao fim e que as
  pausas estão na seção 3.
- **Aviso:** "Atualização de 04/10/2026" no topo do 03.1.

## Verificação

- Edge sem interface (`teste_0410.js`):
  - da versão `HEAD` para a nova, 61 marcações e 4 chaves `trt4:` idênticas;
  - 54/54 e 146/146 horários com duração;
  - 52 quadros;
  - 375 px sem rolagem lateral;
  - console sem erro.
- `checar2.js` ok.

## Pendências

- Commit e push (usuário).

---

# Adendo 13 — 2026-10-04 (revisão de Português)

## O pedido

"Revise os blocos de Português, compare com as provas do TRT4 e valide se é
suficiente — o aluno tem boa base, sobretudo em interpretação."

## Levantamento

241 questões de Português, lidas no QConcursos pelo navegador embutido:
- 51 das 4 provas do TRT4;
- 190 das 16 provas recentes (`fetch` de dentro da página, seletores
  `.q-question-breadcrumb`, `.q-question-enunciation` e `.q-item-enum`).

Nas 16 recentes:
- 91 questões são só de interpretação;
- concordância verbal: 15 de 16 provas, sempre "As normas de concordância verbal
  estão plenamente observadas na frase";
- correlação de tempos e modos: 9/16;
- voz passiva: 8/16;
- pontuação: 10/16, quase sempre "É plenamente adequada a pontuação da seguinte
  frase";
- reescrita e substituição: cerca de 18 questões;
- "emprego do elemento sublinhado" (relativo, preposição ou conectivo): 6/16;
- discurso indireto: 5/16;
- regência pura: 0;
- crase: 2;
- ortografia: 1.
- As provas de 2025 têm menos Português: 6 a 10 questões.

## Conclusão

- **Tempo:** a grade basta — 75 minutos por semana mais o simulado. O aluno
  gabaritou Português no TRT4 de 2022.
- **Cobertura:** os 21 itens do edital têm bloco.
- **Problema real:** o material era curto demais para os sábados de 45 minutos.
  Concordância, regência e crase somavam 1.272 caracteres; verbos, 1.226;
  pontuação, 1.065.

## O que foi feito (`scratchpad/aplicar_portugues.js`, 34 operações, prova por reversão)

- **Tópicos ampliados**, com os formatos da FCC e questões reais explicadas:
  - `pt-crase-conc` (10,6 mil caracteres): roteiro e tabela de concordância
    verbal; concordância nominal; regência ampliada; pronome relativo com
    preposição; crase obrigatória, proibida e facultativa;
  - `pt-verbos` (7,6 mil): passiva por auxiliar, correlação, flexão dos
    derivados;
  - `pt-pontuacao` (4,8 mil);
  - `pt-coesao` (4,6 mil): tabela de conectivos, pronomes no lugar de
    repetições, período único;
  - `pt-reescrita` (3,8 mil): frases corretas, tradução de sentido;
  - `pt-ortografia` (3,3 mil): porquês e pares de palavras.
- **Erros corrigidos:**
  - "se + presente do subjuntivo" → futuro do subjuntivo;
  - padrão ofício: os parágrafos são numerados desde o primeiro quando houver
    três ou mais (Manual de Redação da Presidência, 3ª edição).
- **Selos corrigidos:** `pt-crase-conc` 2/4 → 4/4; `pt-coesao` 2/4 → 4/4;
  `pt-ortografia` 3/4 → 2/4.
- **`ASSUNTOS`** (página 02), quatro linhas corrigidas:
  - Problemas da língua culta: 2006 a 2022;
  - Coesão: 2006 a 2022;
  - Ortografia: 2011 e 2015;
  - Crase: 2011 e 2015.
- **Grade, só títulos (nenhum id mudou):**
  - `s8-ptt` e `s9-pt`: + pronomes relativos com preposição;
  - `s10-ptt` e `s11-pt`: + discurso direto, indireto e indireto livre, com
    link para `pt-interpretacao`;
  - `s13-ptt`: sai o discurso.
- **Aviso:** "Atualização de 04/10/2026 — Português".

## Verificação

- `checar2.js` ok.
- `auditar_manual.js`: 0 ausente e 0 incompleto.
- `conferir_lei_seca.js`: 0 falhas.
- `verif_independente.js`: 24 "NÃO LIDO". Os 2 novos são as notas de texto das
  linhas S8/S9 e S10/S11.
- Edge sem interface (`teste_pt.js`):
  - selos e página 02 certos;
  - S10 com os dois links;
  - 375 px sem rolagem lateral;
  - console sem erro.
- O cache continua **v18**: a versão ainda não publicada cobre esta rodada e a
  anterior.

## Pendências

- Commit e push (usuário).

---

# Adendo 14 — 2026-10-06 (Lote 1: blocos de Direito × edital)

## O pedido

1. "Analise os blocos das matérias de direito com cuidado. Verifique se cobrem
   todo o edital do concurso do trt4 de 2022." Era só para verificar e informar.
2. Depois: plano de correção por prioridade, sem tempo novo na grade.
3. "Opção A, downloads autorizados, pode seguir os três lotes."

## O que a verificação achou (05/10)

- **Edital no manual:** os 324 subitens de Direito e Legislação estão em
  alguma linha "Edital:" do manual.
- **Artigos:** os auditores davam 0 ausente.
- **Problema 1, doutrina sem texto:** havia subitens de doutrina sem texto no
  material, em linhas marcadas "O material basta".
- **Problema 2, normas fora da base:** o Regimento Interno, a CF 102
  incompleta, as INs do TST, as Leis 6.019, 12.023, 8.009, 13.300 e 9.507, e
  as resoluções.
- **Problema 3, selo errado:** o selo de `const-estado` dizia "0/4 provas", mas
  eram 7 questões nas 4 provas do TRT4 e 12 das 16 provas recentes.
- **Incidência por subitem:** contada nas 20 provas, pelo navegador embutido
  (QConcursos, `fetch` de dentro da página).
- **Regimento:** o do próprio tribunal caiu em 15 das 20 provas.

## Defeitos antigos achados e corrigidos neste lote

São defeitos que já estavam no app publicado.

- **Extrator do Planalto:**
  - **Causa:** "Art. 4º-A" / "Art. 4o-A", com o ordinal antes da letra, era
    lido como art. 4, e o texto do 4º-A era descartado em silêncio.
  - **Artigos perdidos:** Lei 8.429, art. 8º-A; Lei 13.146, art. 2º-A; Lei
    8.987, art. 7º-A. Os três estavam em linhas que pedem a lei inteira ou a
    faixa.
  - **Correção:** novo `extrair3.js`, que avisa número repetido, e segundo
    leitor `leitor_b.js`, com código próprio. A comparação dos dois extratores
    antigos não pegava o erro, porque eles usavam a mesma regra.
  - **Conferência:** feita contra os cabeçalhos das páginas do Planalto,
    lidas no navegador.
  - **Faltam na base, mas nenhuma linha pede:** Lei 11.101, 6º-A a 6º-C e
    7º-A; Decreto-Lei 3.365, 4º-A.
- **Formatador (`lei_seca_texto.js`):**
  - "Art. 7º-A." virava "Art. 7º — A.". Agora sai "Art. 7º-A —".
  - "§ 1.º", com ponto, não abria parágrafo: CF 102, 103 e 150; Lei 7.347,
    art. 5º.
  - O rótulo vazio "§ 4.º" (CF 103) ficava no texto.
- **CLT, art. 442-B:** saía "prevista no." No Planalto, a remissão "art. 3º
  desta Consolidação" está tachada por engano. O texto foi conferido na Lei
  13.467/2017. A correção está registrada em `scratchpad/leis/CORRECOES.json`
  e declarada na nota do quadro.
- **Rótulos de link do Planalto que vazavam como texto de lei:**
  - "Regulamento" na CF 14, na Lei 14.133, arts. 20 e 79, e na Lei 8.036,
    art. 20;
  - "Vide art. 96 - ADCT" na CF 18.
  - Agora saem quando vêm depois de fim de frase.

## O que entrou no `index.html` (`scratchpad/aplicar_lote1.js`, 66 recortes, prova por reversão)

- **Constitucional, Opção A:**
  - **Semana 7:** arts. 37 a 41 (`s7-const`, título novo).
  - **Semana 8:** organização do Estado, arts. 18 a 36 (`s8-const` → âncora
    `const-estado`).
  - **Semana 9:** Poder Legislativo, arts. 44 a 75 (`s9-const` →
    `const-estado`).
  - **Semana 12:** Executivo, STF e STJ, arts. 76 a 86 e 101 a 105, com o art.
    102 inteiro.
  - **Junto:** `QC_BLOCO` e links `op-qc` trocados. Os 2 enunciados de
    `s8-const` e `s9-const` (Temas 161/784; greve de servidores) passaram para
    `s7-const`.
  - **Selo de `const-estado`:** 4/4. O aviso de abertura foi reescrito. 7
    entradas do `RAIOX` foram reancoradas em `const-estado`.
  - **Quadros novos:** "Quem processa e julga quem — STF e STJ" e "Congresso,
    Câmara e Senado".
- **Regimento Interno do TRT4:**
  - **Fonte:** PDF do portal, versão até a RA 38/2026, de 01/10/2026.
  - **Base:** `leis/RITRT4.json`, feito por `ri_extrair.js` a partir do
    PyMuPDF.
  - **Conferência da extração:** `ri_conferir_extracao.js`. Os 282 artigos e
    os 68 cabeçalhos reconstituem o corpo lido pelo pdftotext. O teste
    negativo acusou.
  - **Linhas do manual:** S3 (arts. 1º a 18-B), S4 (19 a 28), S5 (29 a 38) e
    S6 (39 a 48 e 91 a 109) passam a "O material basta".
  - **Semana 12:** a linha começa por "Revisão do Regimento…", para não virar
    pedido da norma inteira.
  - **Material:** parágrafo novo e tabela em `leg-trt4`. O texto antigo
    dizia "Presidente, Vice e Corregedor"; hoje são 4 cargos de direção.
- **IN 38/2015 do TST:**
  - **Fonte:** JusLaboris.
  - **Base:** `leis/IN38.json`, feito por `in38_extrair.js`.
  - **Correção declarada:** "devera?" → "deverá".
  - **Diferença aceita entre os dois leitores:** só o deslocamento de "cinco
    dias.".
  - **Linha do manual:** S8, segunda-feira.
- **Leis 6.019 e 12.023 inteiras:** linha S8 de quarta-feira, que passa a "O
  material basta". O `QC_BLOCO` de `s8-dt2` passa a terceirização.
- **Distribuição e valor da causa:** linha S8 de sexta-feira passa a "O
  material basta". Saiu o escopo `L5584:2@dpt-dissidio`: o art. 2º agora é
  inteiro.
- **Texto novo de doutrina:** está em `lote1_conteudo.js`. Cada citação de lei
  foi conferida na base.
  - `adm-organizacao`: outorga e delegação, fundações, órgãos públicos,
    terceiro setor;
  - `adm-atos-poderes`: conceito de ato administrativo, uso e abuso do poder;
  - `dpc-provas`: sentença e coisa julgada;
  - `dt-relacao`: relações lato sensu, temporário, terceirização, avulso;
  - `dt-estabilidade`: força maior;
  - `dpt-dissidio`: distribuição, valor da causa, alçada;
  - `dpt-recursos`: IN 38.
- **Aviso no 03.1:** "Atualização de 06/10/2026 — Direito: blocos conferidos
  contra o edital — vale a partir de segunda-feira, 12/10 (semana 7)".
- **`sw.js`:** cache **v19**.

## Pipeline: o que mudou nos scripts (`scratchpad/`, cópias antigas em `bak_0610/`)

- **Chaves novas:** `L6019`, `L12023`, `L8009`, `L9029`, `L13300`, `L9507`,
  `RITRT4` e `IN38`, em `auditar_manual`, `gerar_lei_seca`,
  `verif_independente` e `conferir_lei_seca`.
- **Rótulos reconhecidos no manual:** "Regimento Interno do TRT4, arts. …" e
  "IN NN/AAAA do TST …". A IN 39 continua fora.
- **`gerar_lei_seca.js`:**
  - `FONTE` dá o rótulo do link (TRT4 ou TST);
  - `NOTA_FONTE` e `NOTA_ARTIGO` são frases que entram na nota do quadro só
    onde a fonte ou o artigo aparece;
  - a nota diz "copiado da fonte oficial … entre 21/09 e 06/10/2026".
- **`lei_seca_texto.js`:**
  - notas do Regimento: parênteses com "Assento Regimental" ou "Resolução
    Administrativa", inclusive nota sem ")" (art. 25), nunca atravessando o
    próximo dispositivo;
  - marcas "Inciso suprimido pelo Assento…";
  - "(" e ")" soltos;
  - "§ N.º";
  - "Art. Nº-A";
  - "Regulamento" e "Vide … - ADCT".
- **`conferir_lei_seca.js`:**
  - vocabulário de nota próprio do Regimento (`OK_INICIO_RI`, `RESTO_RI`),
    usado só para `RITRT4`;
  - nota dentro de parêntese com Assento é aceita;
  - 4 testes negativos acusaram: palavra no meio, palavra antes de nota,
    inciso inteiro e palavra na CLT.
- **`escopos.js`:** + `CF:7@dt-relacao` (XXXIV) e `CF:93@leg-trt4` (XI); −
  `L5584:2@dpt-dissidio`.
- **`checar2.js`:** aceita o arquivo como argumento e compara com o `HEAD`.

## Verificação

- **Regressão a cada mudança de código:** o pipeline regenerou os 52 quadros.
  Só mudaram os pontos previstos:
  - os 3 artigos;
  - as correções de formatação;
  - os rótulos do Planalto;
  - o art. 2º da Lei 5.584.
- **Arquivo final:** idêntico ao ensaio.
  - `conferir_lei_seca`: 0 falha;
  - `conferir_nada_perdido`: 0 faltando;
  - `auditar_manual`: 127 linhas "basta", 0 ausente e 0 incompleto;
  - `verif_independente`: só os 24 "NÃO LIDO";
  - `checar2`: nenhum id perdido, `CHAVES` iguais.
- **Edge sem interface (`teste_0610.js`, `ed05/t3.js`):**
  - **Atualização do `HEAD` para a nova:** 72 marcações e as 4 chaves `trt4:`
    ficaram iguais, inclusive as dos blocos que mudaram de título.
  - **Clique:** na linha S8 de Constitucional, abre `const-estado`.
  - **375 px:** sem rolagem lateral nas páginas 03, 03.1 e 04.
  - **Console:** sem erro.
  - **Busca de texto:** usar escapes `\uXXXX` nas expressões enviadas pelo
    `cdp.js`. Com acento literal, a busca falha.

---

# Adendo 15 — 2026-10-07 (Lote 2: semanas 9 e 10, selos e defeitos antigos da lei seca)

## O pedido

"Lote 1 commitado, pode executar o lote 2 conforme planejamento." O roteiro é
o da Retomada de 06/10.

## O que entrou no `index.html` (`scratchpad/aplicar_lote2.js`, 53 recortes, e `aplicar_lote2b.js`, 1 recorte; prova por reversão nos dois)

- **Segunda, semana 9 (`dpt-recursos`):**
  - IN 40/2016 do TST inteira no quadro Lei seca;
  - texto "Admissibilidade do recurso de revista no TRT — IN 40/2016", com a
    tabela dos recursos contra a negativa de seguimento (Res. 224/2024 e
    226/2026);
  - aviso de que os arts. 1º, § 4º, e 2º da IN 40 citam parágrafos do art. 896
    da CLT revogados pela Lei 13.467/2017;
  - linha do manual: + link "IN 40/2016 do TST (a norma inteira)".
- **Quarta, semana 9 (`dpc-execucao`):**
  - princípios (tabela) e espécies da execução;
  - exceção de pré-executividade;
  - prerrogativas da Fazenda (CPC 183, 496, 534–535, 910) e precatório × RPV:
    60 SM na União (Lei 10.259/2001, art. 17, § 1º), 40 e 30 SM (ADCT 87);
  - Súmula 393 do STJ nova na 04.2 (`STJ-393`, bloco `s9-dpc`, prio 1). A 04.2
    passa a ter 226 enunciados.
- **Sexta, semana 9 (`dpt-partes`):**
  - massa falida, recuperação judicial e liquidação extrajudicial (tabela);
    STF Tema 90; classificação do art. 83;
  - Lei 11.101, arts. 6º, 22, 76 e 83, no quadro. A linha passa a "O material
    basta".
- **Segunda, semana 10 (`dpt-execucao`):** execução provisória (até a
  penhora), por prestações sucessivas, contra a Fazenda (30 dias para embargar,
  Lei 9.494, art. 1º-B) e contra a massa falida.
- **Terça, semana 10 (`adm-controle-servicos`):** serviços públicos
  (conceito, titularidade, encampação × caducidade, interrupção, usuário) e
  bens públicos (afetação, alienação pela Lei 14.133, art. 76, e tabela dos 5
  instrumentos de uso).
- **Sexta, semana 10 (política judiciária):** **não entrou texto**.
  - **Motivo:** as Resoluções CSJT 174/2016 e 288/2021, citadas no edital,
    foram **revogadas pela Resolução CSJT 415, de 23/05/2025** (fonte:
    metadados do JusLaboris, handles 95527, 184270 e 250395).
  - **RA TRT4 05/2022:** continua em vigor, com alterações; a última que vi é
    a RA 13/2026, que a ajustou à Res. 415.
  - **O que mudou:** só o texto da linha do manual, que diz isso.
  - **Situação:** a linha continua "Só na lei". O download da Res. 415/2025 não
    estava na autorização e foi pedido ao usuário em 07/10.
  - **Resolvido em 08/10/2026:** ver "Complemento de 08/10/2026", no fim deste
    adendo.
- **Selos:** recontagem de 25 selos pela regra "provas do TRT4 com questão
  ligada ao tópico no Raio-X" (`selos.js`).
  - A regra foi escrita na legenda da página 04, e a frase "ordenados por
    recorrência" saiu, porque não era verdade.
  - **Textos que contradiziam o Raio-X, corrigidos:** `dpc-teoria`,
    `dpc-especiais`, `dt-seguranca`, `pt-pontuacao` e `adm-pad`. No PAD e na
    pontuação, uma frase explica onde o assunto apareceu dentro de questões de
    outro tópico.
  - **Licitações:** "Novidade do edital de 2022" virou "2 questões em 2022
    (novidade)", e `trt4DoTopico` passa a dar 1.
  - **Raio-X 2022/47 (força maior):** a âncora foi de `dt-cessacao` para
    `dt-estabilidade`, onde o Lote 1 pôs o texto.
  - **`ASSUNTOS`:** 8 âncoras antigas trocadas: 4 para `const-estado`, e
    `dpc-procedimento`, `dpc-atos`, `dpc-precedentes` e `dpc-normas`.
- **Aviso no 03.1:** "Atualização de 07/10/2026 — Direito: segunda parte da
  conferência com o edital — vale para as semanas 9 e 10 (a partir de
  segunda-feira, 26/10)".
- **`sw.js`:** cache **v20**.

## Defeitos antigos da lei seca, achados por um conferidor novo e corrigidos

- **Conferidor novo:** `conferir_rotulos.js`. Ele compara a sequência de
  parágrafos de cada artigo inteiro com a do texto oficial, usando um leitor
  próprio.
- **Ruído:** ele tem 42 diferenças conhecidas, todas do leitor, guardadas em
  `rotulos_base_0710.txt`. Numa próxima rodada, só importa o que não estiver
  nessa lista.
- **Lei 8.429, art. 17, § 6º-A:**
  - **Defeito:** o Planalto compilado omite ")." de "(Código de Processo
    Civil).".
  - **Correção:** conferido na Lei 14.230/2021 e corrigido na base
    (`CORRECOES.json`).
  - **Nota:** declarada no quadro (`NOTA_ARTIGO`).
- **Lei 13.146, art. 45:**
  - **Defeito:** "(Reglamento)", rótulo de link do Planalto escrito com erro,
    vazava para o quadro, e o § 1º saía grudado no caput.
  - **Correção:** `KW` e o vocabulário do conferidor ganharam `Reglament[oa]`.
  - **Nota:** declarada no quadro.
- **Lei 8.112, art. 78:** sobra "§ 1° e § 2°" dos parágrafos revogados.
  Corrigido em `semRotulosVazios`.
- **Parágrafos grudados no anterior** (fonte sem ponto final):
  - CLT 683; CPC 112, 525 e 916; Lei 8.987, art. 15; Decreto-Lei 3.365,
    art. 5º; Lei 8.036, art. 13; Regimento, art. 14 ("§ 3°Não", sem espaço);
  - nova função `quebraGrudados` em `lei_seca_texto.js`: quebra antes de
    "§ N" seguido de maiúscula, salvo depois de palavra de remissão;
  - `grudados.js` lista os candidatos: sobraram só 7 remissões.
- **Lei 11.101, art. 83:**
  - o Planalto escreve "§ 6º § 6º";
  - o quadro sai com o rótulo uma vez;
  - o conferidor aceita só rótulo idêntico colado ao anterior e lista cada
    caso;
  - a nota está no quadro.
- **Comparação com os quadros publicados** (`comparar_manifestos.js`, contra
  `bak_0710/lei_seca_manifesto_lote1.json`):
  - mudaram só os 11 artigos acima;
  - em 8, o texto juntando as linhas é idêntico;
  - entraram 10 artigos novos (IN 40 e Lei 11.101);
  - nenhum artigo saiu.

## Pipeline: o que mudou nos scripts (`scratchpad/`, cópias anteriores em `bak_0710/`)

- **Chave `IN40`:**
  - registrada em `auditar_manual`, `gerar_lei_seca` (com `NOME`, `URL`,
    `FONTE` e `NOTA_FONTE`), `verif_independente` e `conferir_lei_seca`;
  - extração: `in40_extrair.js` (PyMuPDF + pdftotext + `leitor_b` + conferência
    dos arts. 1º-B e 1º-C com a Res. 226/2026 publicada no DEJT).
- **`gerar_lei_seca.js`:**
  - a nota diz "entre 21/09 e 07/10/2026";
  - `NOTA_ARTIGO` ganhou `L8429:17`, `L11101:83` e `L13146:45`.
- **`conferir_lei_seca.js`:**
  - aceita rótulo repetido colado ("§ 6º § 6º") e lista cada caso;
  - + `reglamento` no vocabulário de nota.
- **Testes negativos:** `neg_lote2.js`, com 5 estragos, e um rótulo apagado
  no conferidor de rótulos. Todos acusaram.

## Verificação

- **Arquivo final:** idêntico ao ensaio.
  - `conferir_lei_seca`: 0 falha;
  - `conferir_nada_perdido`: 0 faltando;
  - `auditar_manual`: **128 linhas "basta"**, 0 ausente e 0 incompleto;
  - `verif_independente`: só os 24 "NÃO LIDO";
  - `checar2`: nenhum id perdido, `CHAVES` iguais;
  - quadros: **52 tópicos, 2897 artigos**.
- **Edge sem interface (`teste_0710.js`):**
  - **Atualização do `HEAD` (Lote 1) para a nova:** 73 marcações e as 4 chaves
    `trt4:` ficaram iguais, inclusive nos blocos `s9-*` e `s10-*` tocados.
  - **Clique:** na linha S9 de sexta, abre `dpt-partes`.
  - **Selos, âncoras de `ASSUNTOS` e Raio-X:** conferidos.
  - **04.2:** 226 enunciados.
  - **375 px:** sem rolagem lateral nas páginas 02, 03.1, 04 e 04.2.
  - **Console:** sem erro.

## Downloads e leituras deste lote

- **JusLaboris (autorizado: IN 40):**
  - IN 40, texto vigente e multivigente;
  - Res. 224/2024, Res. 226/2026 e Ato 8/2025, para conferência.
  - Ficaram em `scratchpad/fontes_0710/`.
- **TRT4:** a RA 13/2026 foi salva pela busca web em `tool-results/`, ao
  verificar a RA 05/2022, que estava autorizada.
- **Páginas lidas no navegador, sem baixar:**
  - Planalto: Leis 10.259, 9.494, 11.101, 14.230 e Decreto-Lei 271;
  - STF: Tema 90.

## Complemento de 08/10/2026 — sexta da semana 10 (política judiciária)

**Pedido do usuário (08/10):** seguir o plano; downloads autorizados: Res.
CSJT 415/2025 e RA TRT4 05/2022 compilada. Cache continua **v20** (o Lote 2
ainda não foi commitado).

- **Baixados** (`scratchpad/fontes_0810/`, pasta nova):
  - `res415.pdf` (JusLaboris, handle 250395; 26 páginas; DEJT n. 4232, de
    30/05/2025). Os metadados do JusLaboris não registram alteração em
    08/10/2026 (`jl_250395_full.html`).
  - `ra05/ra05_2022.pdf` (pesquisa de atos normativos do TRT4, "Baixar teor
    integral"). É a "Republicação" com as alterações das RAs 37/2023, 07/2024,
    10/2024 e 13/2025.
- **A RA 05/2022 compilada está desatualizada** (achado de 08/10):
  - a pesquisa de atos do TRT4 (tipo Resolução Administrativa, trecho exato
    "Resolução Administrativa nº 05/2022", 2023 a 08/10/2026) mostra, depois
    da compilada, as **RAs 58/2025 (23/12/2025), 13/2026 (04/05/2026) e 37/2026
    (30/09/2026)**, todas "Altera a Resolução Administrativa nº 05/2022";
  - prova interna: a RA 13/2026 altera os arts. 9º-A, 42-D e 42-F, que não
    existem na compilada;
  - a RA 13/2026 (já salva) reescreve estrutura, coordenação, competência
    territorial e cria o CEJUSC-JT/2º GRAU/REVISTA;
  - **decisão:** a RA 05/2022 **não entrou no quadro**. Baixar as RAs 58/2025
    e 37/2026 não estava autorizado. Ficou como pergunta ao usuário.
- **Extração:** `res415_extrair.js` → `leis/RES415.json` (57 artigos) e
  `leis/RES415AN.json` (Anexo, Código de Ética, 8 artigos).
  - O PDF é justificado: o PyMuPDF parte linhas palavra por palavra ("Art." /
    "13."). O texto é remontado juntando linhas e abrindo linha nova só antes
    de "Art." depois de fim de frase.
  - Provas: leitor B igual; artigos + 14 títulos reconstituem o corpo; o corpo
    é igual ao do pdftotext (sem espaço e hífen); 25 cabeçalhos de página
    tirados.
  - O pdftotext em UTF-8 junta parágrafos inteiros numa linha (até "… IV - a
    Resolução… Art. 56."): serve só para conferência do texto corrido.
- **Achado de conteúdo:** o art. 21 da Res. 415 **proíbe** levar ao Cejusc a
  homologação de acordo extrajudicial (CLT, art. 855-B). O roteiro de 07/10
  supunha o contrário. Só o texto baixado decide.
- **O que entrou no `index.html`** (`aplicar_res415.js`, 4 recortes, prova por
  reversão; conteúdo em `res415_conteudo.js`):
  - **tópico `dpt-especiais`, antes do quadro:** "Política judiciária de
    tratamento adequado das disputas — Resolução CSJT 415/2025" (revogação das
    Res. 174/288; tabela Conaproc × Nupemec-JT × Cejusc-JT; quem concilia e quem
    homologa; gravação; audiência inicial no Cejusc; pegadinha 855-B × RPP
    coletiva) e "Mediação pré-processual — a Reclamação Pré-Processual (RPP)"
    (tabela); Código de Ética (princípios do Anexo); parágrafo "No TRT4" sobre
    a RA 05/2022;
  - **linha do manual (S10, sexta):** "Resolução CSJT 415/2025, arts. 3º e 4º;
    art. 12, caput; art. 13, caput e §§ 5º e 6º; art. 16, caput; art. 18, caput
    e § 5º; art. 20, caput e incisos I, II e IV; arts. 21, 22, 25, 27, 29, 32 e
    34 a 37 · Resoluções CSJT 174/2016 e 288/2021, do edital — revogadas … ·
    Resolução Administrativa TRT4 05/2022 — o texto compilado do Tribunal traz
    as alterações até a RA 13/2025; depois vieram as RAs 58/2025, 13/2026 e
    37/2026 · Resolução CNJ 125/2010". Marca: "Só na lei — o material não
    cobre" → **"Material + leitura da norma"**;
  - **aviso de 07/10:** o item "Sexta da semana 10" agora descreve o que
    entrou e por que a RA 05/2022 ficou fora;
  - **quadro:** 17 artigos da Res. 415 (1.128 palavras), link "CSJT"; a nota
    diz "entre 21/09 e 08/10/2026" e tem frase própria da Res. 415.
- **Pipeline** (cópias anteriores em `scratchpad/bak_0810/`):
  - chave `RES415` em `auditar_manual`, `gerar_lei_seca` (`NOME`, `URL`,
    `FONTE` 'CSJT', `NOTA_FONTE`), `verif_independente`, `conferir_lei_seca`
    (`NOME2K`), `conferir_rotulos` e `triagem_rot` (`patch_res415.js`);
  - `rotuloLei`/`leiDe` reconhecem só "Resolução CSJT 415/2025" no começo do
    trecho; "Resolução CNJ 125/2010", "Resoluções CSJT 174/…" e "Resolução
    Administrativa TRT4 05/2022" continuam sem leitura (testado);
  - `escopos.js`: trechos de 12, 13, 16, 18 e 20 em `dpt-especiais`;
  - `verif_independente.js --tambem-leitura`: confere também as linhas
    "Material + leitura" (sem a opção, saída idêntica à de antes);
  - **armadilha do leitor independente:** em "art. 3º, caput e § 1º; art. 4º",
    ele lê "4º" como § 4º do art. 3º. Por isso a linha pede "arts. 3º e 4º"
    (art. 3º inteiro). Ao escrever linha, não pôr artigo com "º" logo depois
    de um "§".
- **Verificação:** ensaio → real, `cmp` idêntico (também manifesto e blocos).
  - `conferir_texto_res415.js`: 43 afirmações do texto provadas na fonte
    (Res. 415, Anexo, CLT 611/844/855-B, compilada da RA 05); 4 negativos
    acusaram;
  - `conferir_lei_seca` (manifesto e arquivo): 0 falha; `conferir_nada_perdido`:
    0; `auditar_manual`: 128 "basta", 0 ausente, 0 incompleto, linha S10
    "art 17 T17"; `verif_independente`: os mesmos 24 "NÃO LIDO"; com
    `--tambem-leitura`, 0 falta e só os 3 "NÃO LIDO" esperados da linha nova;
    `conferir_rotulos`: igual à base; `grudados`: 7; `comparar_manifestos`
    contra o Lote 1: só os 17 da Res. 415 + os 10 do Lote 2 novos e as mesmas
    11 mudanças; `selos`: só os descritivos; `checar2`: nada perdido;
  - **atenção:** `conferir_lei_seca.js ARQUIVO` compara com o manifesto
    **atual**. Rodar contra um arquivo antigo dá "DIFERE DO MANIFESTO" (deu 75
    em `dpt-especiais`); com o manifesto antigo, 0 falha;
  - `neg_res415.js`: palavra trocada (art. 35), § 5º do art. 13 apagado
    (auditor e leitor independente) e inciso III do art. 34 apagado: 4 de 4
    acusados. O resumo final do auditor conta só as linhas "basta"; a
    acusação de linha "Material + leitura" sai na própria linha;
  - **Edge (`teste_0810.js`):** do HEAD (Lote 1) para a nova, 73 marcações e
    4 chaves `trt4:` iguais (`s10-avulso` marcado continua marcado); clique na
    linha abre `dpt-especiais`; texto antes do quadro; caixa com os 17 artigos;
    375 px sem rolagem lateral (03.1 e 04); console sem erro.
- **Números:** 52 tópicos com quadro, **2914 artigos**, 128 linhas "basta",
  5 linhas "Material + leitura da norma" no manual.

---

# Adendo 16 — 2026-10-08 (modo de estudo: marca-texto e P17)

## O pedido

Depois de commitar o Lote 2 (`d453bce`), o usuário respondeu à proposta sobre
a falta de tempo:
- **A** (núcleo × consulta): não entendeu; **não aplicar**; pediu uma imagem
  que mostre o que mudaria (feita: `scratchpad/opcao_a/opcao_A_ilustracao.png`,
  exemplo real da quarta 14/10, Processo Civil, CPC 312 a 368: 56 artigos,
  113 min → núcleo de 15 artigos, 61 min, para 85 min de teoria);
- **B** (Direito do Trabalho com questões primeiro): "Faça, mas deixe claro e
  de fácil visualização";
- **C** (anotar menos, lembrar mais, com marca-texto): "eu sempre quis";
- **D** (remanejar minutos): em espera.
- Também pediu explicação das RAs 58/2025 e 37/2026 (decide depois).

## O que entrou no `index.html` (`scratchpad/aplicar_modo.js`, 34 recortes, prova por reversão; textos e código em `modo_conteudo.js`)

- **Marca-texto (C), página 04, todos os tópicos:**
  - selecionar um trecho (mouse ou dedo) → botão flutuante **Marcar**; a
    marcação estende até a palavra inteira; marcação que encosta em outra vira
    uma só;
  - tocar numa marcação → **Tirar marcação**, com **Desfazer** por 8 s;
  - barra amarela no alto de cada tópico (depois dos atalhos): contagem,
    **Esconder marcações** (treino: cada trecho vira tarja; tocar revela) e
    **Apagar as marcações deste tópico** (janela `dlgMarcas`, com confirmação);
  - guarda em `trt4:marcas` = `{ v:1, itens:{ idDoTópico:[{ id, q (texto), p
    (32 car. antes), s (32 depois), d (data) }] } }`; acha de novo pelo texto e
    pelo contexto, não pela posição. Se uma atualização mudar o texto e o
    trecho não for achado, ele **continua guardado** e aparece listado na
    barra ("não foi achada no texto atual");
  - valor estranho na chave nunca é sobrescrito: o marca-texto se desliga;
  - **`CHAVE_MARCAS` fica fora de `CHAVES`** de propósito, e `LS.limparTudo`
    pula `trt4:marcas`: "Zerar progresso" não apaga as marcações. Textos do
    zerar (janela, resumo, `confirm`) e da página 07 dizem isso;
  - nota na página 04 (antes de Português) explicando o uso.
- **P2 e P8:** a segunda leitura do P2 é com o marca-texto (não copiar no
  caderno); o passo de memória usa **Esconder marcações**; o R2 (P8) também.
  P2 ganhou parágrafo "desde a semana 7 (12/10)".
- **P17 (B), novo, seção 4:** "Direito do Trabalho — questões primeiro"
  (quarta, 30 min, desde 14/10): 1 min abrir o tópico e **Resolver agora**;
  12 min, seis questões, anotando o **Fundamento** de cada erro; 14 min, ler só
  o que explica cada erro e marcar; 3 min, caderno de erros. Acertou as seis:
  ler o tópico uma vez marcando números. Regra de parada: erro não lido vai ao
  R7 da segunda. Depois, P4 como sempre.
  - grade de quarta (seção 3): "P17 P4" no lugar de "P2 P4"; balão do P17
    funciona;
  - página 03: selo "questões primeiro desde a semana 7";
  - cartões das semanas 7 a 13: selo **"Como estudar: P17 — questões
    primeiro"** nas 10 linhas de Direito do Trabalho de quarta, com link para o
    P17;
  - página 04: quadro azul **"Como estudar este tópico no bloco de
    quarta-feira · desde 14/10 · P17"** no alto de cada um dos 12 tópicos
    `dt-*` (montado por JS, `comoEstudarDT`);
  - índice "Os procedimentos (P1 a P17)".
- **Aviso no 03.1:** "Atualização de 08/10/2026 — modo de estudo: marca-texto
  no material e Direito do Trabalho com questões primeiro — vale a partir de
  segunda-feira, 12/10 (semana 7)".
- **`sw.js`:** cache **v21**.

## Verificação

- Ensaio → real, `cmp` idêntico. `checar2`: nenhum id perdido, `CHAVES`
  iguais às do HEAD. As 146 linhas do manual (quando, título, artigos, marca,
  âncoras), os 64 tópicos do material, `CRONOGRAMA` e `QUESTOES` idênticos ao
  HEAD. Lei seca, nada perdido, auditor, leitor independente e selos: os
  mesmos resultados de antes.
- **Edge (`teste_modo.js ARQ`)**, partindo do HEAD com progresso gravado:
  - 66 blocos marcados e 4 chaves `trt4:` iguais depois da atualização;
  - marcar com o mouse (parágrafo, dois parágrafos do quadro, quadro Lei seca,
    outro tópico), extensão até a palavra inteira, recarregar (mesmas
    marcações), tirar + desfazer, treino (texto transparente; tocar revela),
    seleção + **toque** no celular (375 px), zerar progresso (marcações
    intactas, outras chaves saem), marcação não achada listada e guardada,
    apagar com janela (só o tópico), P17 (4 passos, balão, link do cartão),
    375 px sem rolagem lateral, console sem erro.
  - Armadilhas do teste (não do app): rolagem suave depois de abrir página ou
    recarregar move o alvo; marcação em duas linhas → clicar no primeiro
    retângulo (`getClientRects()[0]`), não no centro do retângulo total.

---

# Adendo 17 — 2026-10-09 (faixa "Versão nova do aplicativo pronta")

## O pedido

O usuário commitou o Adendo 16 (`f77b6c8`, já no `main` pelo PR #16; o
GitHub Pages servia a v21 desde 08/10 20h13 GMT), mas o app do iPad não
atualizava. Causa: o `sw.js` é cache-first, a busca de versão nova só acontece
numa abertura do zero, e a versão nova só aparece na abertura seguinte. Foi
passado ao usuário o roteiro (fechar pela troca de apps, abrir, esperar 1
minuto, fechar e abrir de novo) com o alerta de **não apagar o ícone nem
"Dados de Sites"** (apaga o progresso). Ele pediu: "Sim, faça a faixa de versão
nova".

## O que entrou (`scratchpad/aplicar_faixa.js`, 4 recortes, prova por reversão)

- **`<meta name="versao-app" content="autos-do-estudo-v22">`** no `<head>`: a
  página sabe a própria versão. **Tem de ser sempre igual ao `CACHE` do
  `sw.js`.** Conferir com `node versao.js INDEX SW`; subir as duas juntas com
  `node versao.js INDEX SW NN`. **Não subir o `CACHE` à mão.**
- **Faixa `#faixaVersao`** (fixa no alto, escura, botões **Atualizar agora** e
  **Depois**; aviso amarelo se `estado.simulado` estiver em curso, porque
  recarregar interrompe o simuladão, que não é gravado).
- **Detecção pelos caches**, não só pelo evento: se o cache com o nome da
  versão da página sumiu e existe `autos-do-estudo-vNN` com número maior, a
  faixa aparece. Conferências: ao carregar, em `controllerchange`, quando um
  worker chega a `activated`, ao voltar para a frente (`visibilitychange`) e
  aos 2, 6, 15, 30 e 60 s depois de cada busca. Motivo: no teste, a troca de
  versão terminava durante o carregamento da página (4,9 MB) e nenhum evento
  chegava ao código.
- **Busca de versão nova** (`reg.update()`): ao carregar e ao voltar para a
  frente, no máximo uma vez a cada 10 minutos; também quando a rede volta.
- **Trava contra ciclo:** "Atualizar agora" grava `trt4-versao-recarregada` no
  `sessionStorage` (fora do `localStorage`); se, depois de recarregar, a
  página continuar mais velha que o cache (meta esquecida para trás), a faixa
  não volta na mesma sessão.
- **`sw.js` v22:** a instalação busca os arquivos com `cache: 'reload'`, sem
  passar pelo cache HTTP do navegador (o Pages manda `max-age=600`).
- **Aviso no 03.1:** "Atualização de 09/10/2026 — aplicativo: faixa de versão
  nova — vale desde já". Diz que esta atualização ainda chegou pelo caminho
  antigo.

## Verificação

- Arquivo real idêntico ao testado; `versao.js`: iguais (v22); `checar2`:
  nada perdido, `CHAVES` iguais; auditor e lei seca iguais; linhas do manual
  iguais.
- **`teste_faixa.js`:** servidor local que imita o Pages (`max-age=600`) + Edge,
  passando por v21 (publicada) → v22 → v24 → v25 → v26:
  - v21 → v22 pelo caminho antigo (duas aberturas), dados intactos;
  - faixa depois de abrir (cerca de 1 s); "Atualizar agora" carrega a versão
    nova; sem versão nova, 16 s depois, a faixa continua escondida;
  - ao voltar para a frente depois de 10 min (relógio simulado), faixa com
    aviso do simuladão; "Depois" esconde; a próxima abertura já vem nova;
  - meta esquecida para trás: a faixa aparece uma vez e, depois de recarregar,
    não volta;
  - 375 px sem rolagem lateral; console sem erro.
- **Armadilha do teste:** Edge que sobra de uma rodada anterior continua na
  mesma porta de depuração, e a rodada seguinte se conecta a ele (com o perfil
  velho). Agora a porta é sorteada; encerrar os `msedge` com `perfil-headless`
  antes de cada rodada.

---

# Adendo 18 — 2026-10-12 (súmulas com texto cortado e marca-texto em trecho repetido)

## O pedido

O usuário commitou o HANDOFF (`9a124e5`, `bf12ef8`) e pediu, antes do Lote 3:
1. "Existem alguns trechos que não está marcando": em "Sistema recursal
   trabalhista", marcar só "deserção" no art. 896, § 14, não funcionava.
2. "A súmula 383 do TST parece que teve a ementa cortada, terminando
   abruptamente em '5 (cinco) dias para que'."

## Causa e correção — marca-texto

- A marcação **não falhava: caía em outro lugar.** O trecho "hipóteses de
  intempestividade, deserção, irregularidade de representação" aparece também
  no art. 894, § 3º, II, mais acima no mesmo quadro. As 32 letras guardadas
  antes e depois eram iguais nas duas ocorrências, e `achar()` ficava com a
  primeira.
- **Correção:** `criar()` grava também `i` (posição no texto do tópico, o
  mesmo índice de `indice()`); `achar()` desempata pela ocorrência mais perto
  de `i`. Marcação antiga, sem `i`, continua onde estava (a primeira). Formato:
  `{id,q,p,s,i,d}`, `v:1` mantido; nada mais muda na chave `trt4:marcas`.
- **Prova:** `juris_1210/teste_marca_1210.js` — com o mouse, "deserção" fica
  no § 14 e continua lá depois de recarregar; marcação antiga fica no art.
  894; varredura com as funções do próprio script da página: 195.259 palavras
  de 5+ letras em todos os tópicos, cada uma marcada sozinha. Com o código
  antigo, 5.808 iriam para outro lugar; com o novo, 0.
- O aviso do 03.1 diz ao usuário que, se ele já tentou marcar o § 14, pode
  haver uma marcação em "deserção" no art. 894, § 3º, II.

## Causa e correção — textos de jurisprudência

- A fonte antiga (`fontes/tst.json`, extraída do PDF do Livro de Súmulas)
  **não existe mais**: a pasta `scratchpad/fontes/` está vazia (também na cópia
  `ferramentas-scratchpad`). O conferidor antigo (`conferir_juris_caixas.js`)
  só exigia que cada peça fosse **trecho** do texto oficial, e por isso deixou
  passar peças que paravam no meio da frase (quebra de página/linha do PDF) e
  parênteses que sumiram partindo uma frase em duas.
- **Fonte desta vez:** o portal oficial do TST, lido no navegador (sem
  download): `jurisprudencia.tst.jus.br/?tipoJuris=SUM&orgao=TST&pesquisar=1`
  (463 súmulas numa página só) e `?tipoJuris=OJ&orgao=TST&pesquisar=1` (709
  OJs); teses vinculantes na tabela
  `tst.jus.br/en/nugep-sp/recursos-repetitivos/precedentes-vinculantes` (214
  temas, "atualizadas em 9 de outubro de 2026"). STF: listas
  `portal.stf.jus.br/jurisprudencia/sumariosumulas.asp?base=30` (súmulas) e
  `base=26` (vinculantes), com o link de cada enunciado (o número do link não é
  o da súmula). STJ: `Jurisprudência/sumulas_stj.md`.
- **Resultado da conferência (159 cartões do TST na 04.2 e 13 quadros):**
  - **17 cartões com item cortado**, completados com o texto do portal (o
    pedaço que já existia ficou igual; só se acrescentou o que faltava):
    Súmulas 74 e 263 (parêntese sumido partia a frase em duas peças: viraram
    uma), 85 IV, 219 I, 303 II, 364 II, 366, 369 V, 383 II, 414 I, 417 II, 421
    II, 437 I e III, 444; OJ 69 da SDI-2; teses vinculantes 14 e 18 (item 1).
  - **Súmula 372, I:** entrou a nota do próprio TST "(item cancelado por perda
    de eficácia…)".
  - **Quadro do espelho da semana 11:** Súmula 299, III, estava cortada;
    completada, e o título virou "Súmula 299, I a III, do TST" (o item IV não
    está no quadro).
  - **18 cartões transcrevem só parte dos itens** (escolha antiga e
    deliberada, explicada na nota de cada um). Campo novo `itens` em `JURIS`
    (ex.: `"itens":"os itens I, III e V"`), e o cartão mostra "Transcritos aqui
    só os itens I, III e V. Os outros itens estão no portal do TST.":
    Súmulas 6, 85, 90, 100, 219, 299, 303, 331, 368, 393, 395, 436, 437, 448,
    456; teses 18, 19 e 21.
  - **STF:** as 15 súmulas vinculantes, as 20 súmulas e o Tema 138 conferem
    palavra por palavra. O Tema 485 não foi reconferido (a página do tema não
    mostra a tese). **STJ:** as 13 conferem com `sumulas_stj.md`.
  - **Diferenças aceitas entre o app (que segue o Livro de Súmulas) e o
    portal:** trema ("freqüência", "líqüido"), "§2o" × "§2º", Súmula 378, III
    (portal: "prevista no n no art. 118"), Súmula 277 (portal: "modificados"),
    OJ 83 da SDI-1 (portal: "§ 1º, da CLT"). E notas do portal que não são
    texto: "(ex-…)" e "- Entendimento do item I reafirmado no IRR nº 284.".
- **Conferidor novo:** `juris_1210/conferir_juris_tst.js INDEX` abre um Edge
  sem interface no portal do TST e confere tudo em memória (nada do portal é
  gravado). Exige, além de "ser trecho", que **cada item transcrito vá até o
  fim** (corte só com "[...]") e que **itens fora** estejam declarados no
  campo `itens` (cartão) ou no título (quadro, "Súmula N, I a III, do TST").
  Contra a v22 acusou todos os defeitos acima; contra a v23, "NENHUM
  PROBLEMA" (172 de 172).

## O que entrou (`juris_1210/aplicar_1210.js` + `dados_1210.js`, 45 recortes)

- Prova por reversão; conferência de `JURIS` enunciado a enunciado (31
  mudaram, todos os outros iguais); ensaio e real iguais por `cmp`.
- Aviso no 03.1: "Atualização de 12/10/2026 — correções: súmulas com texto
  cortado e marca-texto — vale desde já".
- **v23** com `node versao.js INDEX SW 23` (meta e `CACHE` iguais). É a
  primeira atualização que chega pela faixa "Versão nova do aplicativo pronta".

## Testes

- `juris_1210/teste_atualiza_1210.js VELHO NOVO`: estado realista gravado na
  v22 (66 blocos, questões, marcações) → v23 no mesmo perfil: as 5 chaves
  `trt4:` idênticas; 04.2 com 18 linhas "Transcrito(s) aqui só…", 383 até o
  fim, 74 em 3 parágrafos e 263 em 1; busca "seja sanado o vício" acha as
  Súmulas 383 e 395; aviso de 12/10 no alto do 03.1; 375 px sem rolagem
  lateral; console sem erro.
- Conferidores de sempre com os números de antes: lei seca 0 falha; nada
  perdido 0; auditor 0 ausente e 0 incompleto; independente só os 24 "NÃO
  LIDO"; rótulos iguais à base; grudados 7; selos só os descritivos;
  `checar2` sem perda de id e `CHAVES` iguais.

---

# Adendo 19 — 2026-10-14 (marca-texto: botão acima do trecho)

## O pedido

O usuário commitou o Adendo 18 (`ea4991e`, PR #18; o Pages servia a v23 em
14/10) e pediu: "Altere o posicionamento do botão de marcar na marca-texto.
Atualmente o padrão é abaixo, altere para aparecer acima por padrão e só
aparecer abaixo quando estiver muito no topo para ficar visível".

## O que entrou (`botao_1410/aplicar_1410.js`, 3 recortes, prova por reversão)

- `mostrar()` do marca-texto: o botão fica **acima** do trecho (10 px de
  folga). Vai para **baixo** só quando, acima, passaria do "teto" =
  `topoLivre()` + 10 px. Trecho mais alto que a tela: o botão fica no pé da
  tela. Vale para "Marcar" e para "Tirar marcação" (mesmo botão flutuante).
- `topoLivre()`: o maior entre a área da barra de status do app instalado no
  iPad (sonda `position:fixed` com `height:env(safe-area-inset-top)`) e o pé da
  faixa de versão nova, quando aberta.
- Aviso no 03.1: "Atualização de 14/10/2026 — marca-texto: botão acima do
  trecho — vale desde já".
- **v24** com `node versao.js INDEX SW 24`.

## Testes

- `botao_1410/teste_botao_1410.js ARQ`, no computador (1280×800) e no celular
  (375×800): trecho no meio → acima; trecho a 20 px do alto → abaixo; faixa
  aberta e trecho logo abaixo dela → abaixo, sem ficar sob a faixa; rolar com
  a seleção ativa → continua acima; "Tirar marcação" → acima. Na versão
  anterior (controle), os mesmos casos davam abaixo.
- `juris_1210/teste_atualiza_1210.js` v23 → v24: as 5 chaves `trt4:` idênticas;
  aviso de 14/10 no alto; 375 px sem rolagem lateral; console sem erro.
  `checar2`: sem perda de id, `CHAVES` iguais.
- **Não testável aqui:** o menu do próprio iPad (Copiar, Consultar…), que
  também aparece acima da seleção. Se cobrir o botão, aumentar a folga ou
  voltar o botão para baixo só no toque.

---

# Adendo 20 — 2026-10-17 (barras "Contra a meta" que nunca apareceram)

## O pedido

O usuário commitou o Adendo 19 (`e8540d4`, PR #19; o Pages servia a v24) e
perguntou por que a coluna "Contra a meta global da fase" "não altera mesmo
que já estejamos na semana 7", supondo que a falta do simulado da semana 1
impedisse. A primeira resposta (sem ver a tela) explicou a regra das fases;
o print dele mostrou o defeito real.

## Causa

- `barraMeta()` devolve `<span class="d-barra">`, e a regra CSS da barra não
  tinha `display`. Num `<span>` (elemento de linha), `height:10px` e
  `min-width:104px` são ignorados: a barra tinha 1 px de largura, o
  preenchimento (`<i>`, bloco) não tinha altura, e o traço da meta (`<em>`,
  absoluto, `left:N%` de uma largura zero) ficava encostado à esquerda — o
  traço vertical do print. **Existia desde a primeira versão (`99cc303`,
  08/09)**, nas quatro barras: placar semana a semana, tabela por
  disciplina, painel do bloco crítico e histórico dos simulados.
- Os testes antigos conferiam o DOM (classe, `aria-label`, texto), nunca a
  geometria na tela; por isso passaram.
- A falta do simulado da semana 1 não tinha relação: a lógica das metas
  (semana 1 linha de base; 2–4: 70%; 5–7: 78%; 8–10: 85%; 11–13: 90%; Geral:
  meta de hoje) estava certa.
- Segundo defeito no print: a linha "Antes do placar semanal" (respostas sem
  data, de antes de o placar separar semanas) dizia "linha de base".

## O que entrou (`meta_1710/aplicar_1710.js`, 9 recortes, prova por reversão)

- `.d-barra{display:block; …; margin-top:4px}` e `.d-base{display:block;
  margin-top:5px}` (o rótulo vai para baixo da barra).
- `barraMeta(pct, meta, rotuloSemMeta)`: rótulo próprio quando não há meta.
  No placar semanal, "Antes do placar semanal" → "sem meta: respostas sem
  data"; "Fora do cronograma" → "sem meta: fora do cronograma". A semana 1
  continua "linha de base".
- Nota da tabela "Placar semana a semana": diz contra qual meta cada semana é
  medida.
- Aviso no 03.1: "Atualização de 17/10/2026 — correção: barras “Contra a
  meta” no painel “Meu desempenho” — vale desde já".
- **v25** com `node versao.js INDEX SW 25`.

## Testes

- `meta_1710/teste_barras_1710.js ARQ [rótulo]`: estado como o do print;
  mede na tela cada barra (largura ≥ 100 px, altura ≥ 9 px, preenchimento =
  percentual ± 1, traço na posição da meta ± 1) no iPad em retrato
  (820×1180), no celular (375×800) e no computador. Na v24 (controle): todas
  "ERRADO", barra 1×42 px, igual ao print. Na v25: 13 de 13 OK nas três telas;
  sem rolagem lateral.
- `meta_1710/ver_meta.js ARQ`: a lógica das metas em dois cenários (com e sem
  respostas nas semanas 5 a 7), sem simulado na semana 1.
- `juris_1210/teste_atualiza_1210.js` v24 → v25: 5 chaves `trt4:` idênticas;
  aviso de 17/10 no alto; console sem erro. `checar2`: sem perda de id.
- **Lição:** teste de tela mede a geometria (`getBoundingClientRect`), não só
  o DOM.

---

# Adendo 21 — 2026-10-20 (parecer de um amigo desenvolvedor: plano em ondas; Onda 0 e Onda 1, v26)

## O pedido

O usuário commitou o Adendo 20 (`734f332`, PR #20, merge `9264103`; o Pages
servia a v25) e trouxe um parecer de um amigo desenvolvedor
(`C:\Users\thale\Documents\Análise amigo.md`): "Analise o parecer, diga se
concorda e estabeleça um plano de implantação". Plano aprovado em modo de
plano: `C:\Users\thale\.claude\plans\woolly-finding-squid.md`.

## Veredito sobre o parecer (conferido no código, na base de leis e no portal)

- **Concordo:**
  - pasta principal parada na v2;
  - 5 gabaritos "conferir" do Raio-X (2 mudaram);
  - 4 cartões da IN 39 sem nota sobre a lei atual;
  - avisos desatualizados sobre o STJ nas páginas 04.2 e 07;
  - tópicos com poucas questões;
  - backup exportar/importar;
  - busca no material.
- **Correções ao parecer:**
  - 2022 Q21 vale pelo art. 25, **IV** e VII (não V);
  - não existe "Vice-Corregedor" no art. 16, § 4º;
  - a frase citada do cartão `in14` não existe (mas o ponto procede);
  - as chaves do `localStorage` não têm `:v1`;
  - o estudo de caso não é o P5 e **já existe** (9 casos com espelho e régua);
  - o contraste Convenção 87 × unicidade **já está** em `dt-coletivo`.
- **Discordo:**
  - mudar a disciplina da CO04 e a âncora das OJs 64, 65 e 67 da SDI-2 (são
    âncoras cruzadas de propósito; nenhum tópico de Processo do Trabalho trata
    de mandado de segurança contra liminar);
  - tirar a Lei 12.527 das fontes (foi consultada: prova de 2015, Q57);
  - marca-texto sob demanda por ora (medir antes).
- **Decisões do usuário (20/10):**
  - 6 questões de `dpc-provas` já na Onda 1;
  - **download das RAs 58/2025 e 37/2026 autorizado**;
  - busca no material, sim;
  - simuladão retomável, não.

## Ondas

| Onda | Versão | O quê | Situação |
|---|---|---|---|
| 0 | — | pasta principal em ff com `origin/main` | **feita** |
| 1 | v26 | Raio-X, IN 39, textos 04.2/07, 6 questões de `dpc-provas` | **feita, esperando commit** |
| 2 | v27 | backup exportar/importar (`navigator.share` no iPad; importação com janela modal e "Desfazer") | a fazer |
| 3 | v28 | Lote 3 + questões até 6 por tópico + RA TRT4 05/2022 (até 05/11) | a fazer |
| 4 | v29 | busca no material (página 04) | a fazer |

## Onda 0 — pasta principal

A cópia não versionada do `HANDOFF-projeto.md` na raiz era idêntica à do
`origin/main` e bloquearia o fast-forward. Ela foi para
`scratchpad/bak_2010/HANDOFF-raiz-antes-do-ff.md`. Depois veio o
`git -C <raiz> merge --ff-only origin/main`, e a raiz ficou em `9264103`
(v25). **Hábito novo:** não copiar mais o HANDOFF para a raiz com `cp`.
Depois de cada PR do usuário, fazer o `--ff-only` na raiz.

## Onda 1 — v26 (`parecer_2010/aplicar_2010.js`, 12 recortes, prova por reversão)

- **6 questões novas** `PC57`–`PC62` (`dpc-provas`, ano 2006, que é o ano em
  que o tópico caiu: coisa julgada, Q42):
  - assuntos: ônus da prova (373), fatos que não dependem de prova
    (374/375), inspeção (481–484), fundamentação (489/492), coisa julgada
    (503, 504, 506) e liquidação (509/512);
  - dados em `parecer_2010/q_dpc_provas.js`, com `provas`: 38 trechos
    conferidos letra por letra contra `leis/cpc.json` por
    `conferir_q_novas.js` (formato como `validar_j.js`; teste negativo
    `--estragar`).
- **Raio-X:**
  - 2011 Q45 → `mudou` (Lei 8.036, art. 3º, § 3º, na redação da Lei
    13.932/2019; hoje nenhuma alternativa certa);
  - 2022 Q25 → `mudou` (Assento Regimental 05/2025; art. 16, § 4º, II e III;
    as outras alternativas seguem erradas pelos §§ 7º, 8º, 10 e 13-A; nenhuma
    certa);
  - 2015 Q25, 2022 Q21 e 2022 Q27 → `vale` (arts. 44, IX e X; 25, IV e VII;
    39, VI, e 154);
  - fica `conferir` só 2006 Q25 (gabarito contra a lei);
  - placar da página 02: 14 mudaram, 1 a conferir.
- **IN 39** (`IN39_HTML`, campo `note` de `in3-vii`, `in3-iv`, `in14` e
  `in3-xv`):
  - a string é `JSON.stringify` com `<` → `\u003c` (a recodificação do
    original é provada antes);
  - só os 4 `note` mudaram;
  - trechos entre aspas conferidos com a CLT (818, 840), com a Res. 415
    (art. 12) e com a Tese 75 por `conferir_notas_in39.js`, com teste
    negativo;
  - a frase das ADIs 6.050, 6.069 e 6.082 é a mesma do quadro do art. 223-G;
  - o arquivo de origem em `Leis/` não mudou.
- **Textos fixos:**
  - 04.2: "De onde vem o texto" (conferência de 12/10 e STJ conferido);
  - 07: parágrafo "outubro de 2026", fontes com STJ conferido, portal do TST,
    Lei 8.036 e Regimento; Lei 12.527 "fora do edital de 2022".
- **Aviso no 03.1:** "Atualização de 20/10/2026 — correções apontadas no
  parecer e 6 questões de Processo Civil — vale desde já".
- **v26** com `node versao.js INDEX SW 26`.

## Testes da Onda 1

- `parecer_2010/teste_onda1.js VELHO NOVO`:
  - v25 → v26 no mesmo perfil, as 6 chaves `trt4:` idênticas;
  - Raio-X 14/1;
  - as 4 notas visíveis no iframe da 04.1 (414 px de largura);
  - "Resolver agora →" em `dpc-provas` abre `PC57`–`PC62`, e a resposta
    entra no placar de Processo Civil;
  - 04.2, 07 e aviso conferidos;
  - 375 e 820 px sem rolagem lateral em 6 páginas;
  - console sem erro.
- Conferidores com os números da linha de base: lei seca 0 falha, nada
  perdido 0, auditor 0/0, independente só os 24 "NÃO LIDO", selos só os
  descritivos, `checar2` sem perda (520 questões).
- `juris_1210/conferir_juris_tst.js`: 172 de 172. **A página de precedentes
  do TST mudou de endereço** (sem o "/en"; o antigo dá "Não encontrado"). O
  conferidor foi corrigido e agora para com erro se a tabela vier vazia (antes
  acusava "SEM TEXTO OFICIAL" tese a tese). Tabela "atualizada em 15 de
  outubro de 2026".

---

# Adendo 22 — 2026-10-20 (Onda 2: cópia de segurança do progresso, v27)

## O pedido

"já fiz o commit, siga para a Onda 2". O commit da Onda 1 (`8a2a6fa`) estava
no ramo do GitHub, mas o PR ainda não tinha sido mesclado (o Pages servia a
v25). O usuário foi avisado de que precisa abrir e mesclar o PR para a v26
chegar ao iPad.

## O que entrou (`backup_2010/aplicar_backup.js` + `modulo_backup.js`, 14 recortes, prova por reversão)

- **Página 07, seção "Progresso gravado neste navegador":** caixa `#backup`
  (antes da caixa de zerar) com os botões **Salvar backup**, **Restaurar
  backup** e **Desfazer a última restauração** (este só aparece quando existe
  a cópia), um `<input type="file">` escondido e a linha de estado
  `#backupMsg`.
- **Salvar backup:**
  - arquivo `autos-do-estudo-backup-AAAA-MM-DD.json` com
    `{app:'autos-do-estudo', formato:1, versao, exportadoEm, chaves:{'trt4:…': texto exato}}`;
  - entram as 6 chaves do progresso (`CHAVES` + `trt4:marcas`);
  - com tela de toque (`pointer: coarse`) e `navigator.canShare`, usa
    `navigator.share` com o arquivo (no iPad: "Salvar em Arquivos"). Se a
    janela for fechada (`AbortError`): "Backup não salvo". No computador:
    `<a download>` com blob.
- **Restaurar backup:**
  - lê o arquivo e confere: JSON, `app`, `formato`, só as 6 partes
    conhecidas, cada parte com JSON válido e a forma que o carregador aceita;
    qualquer falha recusa tudo com "Nada foi alterado";
  - a janela `#dlgBackup` mostra a tabela "No arquivo × Neste navegador
    agora × Ao restaurar";
  - o que o arquivo traz substitui; o que ele não traz fica como está;
  - antes de trocar, grava `trt4:antesDaRestauracao` = `{em, chaves:{parte: texto ou null}}`
    (chave nova, só acréscimo); se não conseguir gravar, desfaz e avisa;
  - depois `location.reload()`, com o recado no `sessionStorage`
    (`trt4-backup-aviso`).
- **Desfazer a última restauração:** janela com "Antes da restauração ×
  Agora". Volta cada parte (`null` = apaga a chave), apaga a cópia e
  recarrega.
- **`LS.lerCru` e `LS.gravarCru`**, novos (texto exato; `gravarCru` relê
  para confirmar).
- **Zerar progresso:** a janela diz que apaga também a cópia de antes da
  restauração (se houver) e que "a única cópia desses dados é um backup que
  você tenha salvo antes". `zerarProgresso()` chama
  `window.atualizarBackupUI`.
- **Página 03, "Meu desempenho":** link "cópia de segurança, na página 07"
  (`data-pg-ir="metodo" data-pg-anc="backup"`). O tratador geral de cliques
  passou a repassar `data-pg-anc` para `abrirPagina(pg, anc)`.
- **Marca-texto pintado só ao abrir o tópico:** tópico fechado com marcações
  ganha um `toggle` de uma vez só. Tópico sem marcação continua com a barra
  criada na hora. Medição (`backup_2010/medir_marcas.js`), com marcações nos
  64 tópicos:
  - índice ~320 ms;
  - abertura do app ~600 ms → ~260 ms (CPU 1×);
  - abertura ~5,7 s → ~3,1 s (CPU 4×);
  - igual a sem marcações.
- **Comentário da `IN39_HTML`** corrigido: o conteúdo não é mais
  "inalterado"; 4 `note` mudaram em 20/10.
- **Aviso no 03.1:** "Atualização de 20/10/2026 — cópia de segurança (backup)
  do progresso — vale desde já".
- **v27** com `node versao.js INDEX SW 27`.

## Testes

- `backup_2010/teste_backup.js VELHO NOVO`, por HTTP (`servir.js`,
  `/velho.html` e `/novo.html` na mesma origem):
  - v26 → v27 sem perda;
  - salvar → o arquivo tem as 6 chaves com o texto exato;
  - zerar → restaurar → as 6 chaves voltam iguais ao backup;
  - a cópia de antes = o estado zerado;
  - o app lê os dados (80 blocos, 15 respostas);
  - desfazer → volta ao estado zerado (o app grava `historicoQuestoes = {}`
    ao abrir; vazio = ausente) e o botão some;
  - JSON estragado, arquivo de outro app e parte estragada são recusados sem
    mudar nada;
  - cancelar não muda nada;
  - arquivo sem marcações: as marcações daqui ficam e o resto vem do
    arquivo.
- `backup_2010/teste_backup_ipad.js URL ARQ`:
  - tela de toque com `navigator.share` simulado: compartilha o arquivo, não
    baixa e mostra "Backup não salvo" se a janela fecha;
  - o link da página 03 leva à caixa;
  - botões de 44 px dentro da tela a 375 e 820 px;
  - a janela cabe, sem rolagem lateral e com o botão visível.
- `juris_1210/teste_marca_1210.js` (marcar, recarregar, marcação antiga e
  varredura de 195.259 palavras: 0 erros) e `teste_modo_2010.js` (cópia do
  `teste_modo.js` que reabre os dois tópicos marcados antes de comparar;
  com a pintura sob demanda, tópico fechado não tem `mark` desenhado).
- Conferidores com os números de sempre; `checar2` sem perda; `CHAVES`
  iguais.
- **Armadilha do teste:** o Edge sem interface **ignora**
  `Browser/Page.setDownloadBehavior` e grava os downloads em
  `C:\Users\thale\Downloads`. Sete arquivos de teste foram parar lá e
  foram movidos para `backup_2010/downloads_reais/`. **Nunca disparar
  download real em teste**: trocar `HTMLAnchorElement.prototype.click` só
  para os links com `download` e chamar o original para os demais (trocar
  para todos quebra os links do app).

---

# Adendo 23 — 2026-10-21 (Onda 3, parte A: Resolução Administrativa TRT4 05/2022, v28)

## O pedido

"Continue do próximo passo do HANDOFF" (depois de compactar). O próximo passo
era a Onda 3. A parte A (RA TRT4 05/2022, prazo 05/11) saiu sozinha como
**v28**, como a Retomada previa; as partes B e C (questões e resto do Lote 3)
ficam para a **v29**, e a busca no material (Onda 4) passa a **v30**.

## Fontes (pasta nova `scratchpad/fontes_ra05/`)

- **A busca por trecho exato escondia uma RA.** "Resolução Administrativa nº
  05/2022" não acha os atos que escrevem "Resolução Administrativa **TRT4** nº
  05/2022". Pesquisa certa: tipo Resolução Administrativa, "Todas as
  palavras" = `05/2022`, data inicial depois da compilada (01/05/2025).
  Resultado em 21/10/2026: **RA 35/2025** (17/09/2025, cria o CEJUSC-JT/BENTO
  GONÇALVES; inclui o art. 10, VII, o art. 11, VII e muda o Anexo), **RA
  58/2025**, **RA 13/2026** e **RA 37/2026**. Nenhuma republicação nova (a
  pesquisa ainda entrega a compilada até a RA 13/2025).
- **Downloads autorizados em 21/10/2026:** RA 35/2025, RA 24/2022
  (republicada em 2024) e RA 23/2024 (além das RAs 58/2025 e 37/2026, de
  20/10). O `curl` só passa com user-agent de navegador e
  `Referer: https://pesquisatextual.trt4.jus.br/pesquisas/atos_normativos`;
  os links de download (`/pesquisas/rest/download/ato/…`) saem da página de
  resultados.
- **RA 24/2022:** o art. 4º dela, o que alterava a RA 05/2022, foi
  **revogado pela RA 37/2023**; nada dela vale hoje na RA 05/2022. A **RA
  23/2024** só mexe na RA 08/2022 (Ouvidoria) e na própria 24/2022.
- **RA 58/2025** muda muito mais do que a pesquisa mostrava: arts. 2º, 3º,
  4º, 9º-A (novo), 10, 12, 13, 15, 16, 18, 19, 21, 24, 26, 28, 32, 37, 38,
  40, 41, 42, 42-A a 42-H (novos), 43, 45 e 45-A (novo); revoga o art. 17.
- **Achado de conteúdo:** até a RA 58/2025, o art. 40 permitia que os
  CEJUSCs de 1º Grau fizessem audiência de homologação de acordo
  extrajudicial; hoje o art. 40 repete o art. 21 da Res. CSJT 415/2025
  (não vai ao CEJUSC). Regra de transição da RA 13/2026, art. 30: a
  coordenação do CEJUSC-JT/2º GRAU pelo Vice-Presidente Institucional começa
  em 01/12/2026.

## Redação vigente montada (`scratchpad/ra05/`)

- `ra05_lib.js`: lê o texto do PyMuPDF corrido e divide em dispositivos
  (rótulo no começo de linha ou depois de ". ; :"; "§"/"Art." só abrem
  dispositivo se a palavra seguinte é maiúscula). A RA 58/2025 tem trechos
  justificados com uma palavra por linha ("§" / "1º" / "Compete"); a RA
  13/2026 tem "§ 2º" sozinho numa linha.
- `ra05_montar.js` → `leis/RA05.json` (61 artigos, 250 dispositivos):
  compilada + RA 35/2025 + RA 58/2025 + RA 13/2026 + RA 37/2026, na ordem;
  cada dispositivo alterado leva a nota "(redação dada pela Resolução
  Administrativa TRT4 nº …)" ou "(incluído pela …)", no estilo da compilada
  (o gerador do quadro tira essas notas, como faz com as do Regimento).
  Revogações escritas à mão (RA 58, art. 28; RA 13/2026, art. 29, I) e
  conferidas no texto. Saídas auxiliares: `RA05_origem.json`,
  `RA05_ops.json`, `RA05_relatorio.txt` (cada artigo alterador, a
  instrução e o que trouxe).
- `ra05_conferir.js` (0 falha): os dois leitores (pdftotext × PyMuPDF)
  iguais nos 5 documentos (fora o Anexo Único, que não entra); cada
  dispositivo está na fonte que a nota diz, inteiro (depois dele vem outro
  rótulo); cadeia (vale a última RA que transcreveu; revogado não aparece);
  as 53 instruções ("Alterar … do artigo N") batem com o que foi transcrito.
  `--estragar 1..5`: 5 de 5 acusados.

## O que entrou no `index.html` (`ra05/aplicar_ra05.js`, 4 recortes, prova por reversão; conteúdo em `ra05/ra05_conteudo.js`)

- **Tópico `dpt-especiais`:** o parágrafo "No TRT4" de 08/10 virou a seção
  "No TRT4 — Resolução Administrativa 05/2022": por que o texto foi montado;
  art. 45-A; tabela (NUPEMEC-JT/TRT4 e quem o coordena; os 7 CEJUSCs de 1º
  Grau; os 2 de 2º Grau e quem coordena cada um); transição até 30/11/2026;
  mediação pré-processual no TRT4 (arts. 41, 42, 44 e 45); caixa "Mudou em
  dezembro de 2025" (art. 40 antigo × atual).
- **Linha do manual (S10, sexta):** "Resolução Administrativa TRT4 05/2022,
  art. 2º, caput e § 4º; art. 10, caput e incisos I a VII; arts. 14 e 45-A —
  na redação de hoje…" e "Resolução CNJ 125/2010 — na Justiça do Trabalho, a
  política que ela instituiu é regida pela Resolução CSJT 415/2025 (art.
  1º)". Marca: "Material + leitura da norma" → **"O material basta"**.
- **Quadro Lei seca:** caixa da RA 05/2022 com os arts. 2º (caput e § 4º),
  10 (caput e incisos), 14 e 45-A, link "TRT4" (pesquisa de atos). A nota da
  caixa diz que o texto foi montado pelo aplicativo e de qual RA vem cada
  artigo; a data de cópia desse tópico vai até 21/10/2026 (nos outros 51,
  continua 08/10/2026).
- **Recorte por carga:** a primeira escolha (também arts. 15, 16, 41, 42, 44 e
  45 no quadro) dava ~1.070 palavras (~20 min a 55 palavras/min) num bloco
  de 15 min; ficou ~720 palavras (texto 446 + lei 276, ~13 min), fora a nota.
  O texto do material cobre os artigos que saíram do quadro.
- **Aviso no 03.1:** "Atualização de 21/10/2026 — Resolução Administrativa
  TRT4 05/2022 no material — vale desde já" (diz o acréscimo de leitura e que
  marcação feita no parágrafo antigo fica guardada como não achada).
- **v28** com `node versao.js INDEX SW 28`.

## Pipeline (`ra05/patch_pipeline_ra05.js`; cópias anteriores em `scratchpad/bak_2110/`)

- Chave `RA05` em `auditar_manual`, `gerar_lei_seca` (`NOME`, `URL`,
  `FONTE` 'TRT4', `NOTA_FONTE` = `ra05/nota_fonte_ra05.txt`),
  `verif_independente`, `conferir_lei_seca` (`NOME2K`; e a regra de notas do
  Regimento também para `RA05` em `perdas`), `conferir_rotulos` e
  `triagem_rot`; `rotuloLei`/`leiDe` reconhecem "Resolução Administrativa
  TRT4 05/2022" no começo do trecho; `escopos.js`: `RA05:2` (§ 4º) e
  `RA05:10` (incisos I a VII) em `dpt-especiais`.
- **Atenção:** os conferidores novos leem a linha antiga (sem artigos) como
  "RA 05/2022 inteira" e acusam FALTA num arquivo de antes da v28; é
  esperado.

## Verificação

- Ensaio → real, `cmp` idêntico (`index.html` e `sw.js`).
- `ra05/conferir_texto_ra05.js`: 31 afirmações provadas (RA05.json,
  compilada, RAs 13/2026, 35/2025, 37/2026 e 58/2025, Res. 415, CLT), mais
  "sete" (7 incisos no art. 10), "dois" (2 no art. 14) e o § 3º dentro do
  art. 30 da RA 13/2026; `--estragar 0..30`: 31 de 31 acusados.
- `conferir_lei_seca` (manifesto e arquivo): 0 falha, 2918 artigos;
  `conferir_nada_perdido`: 0; `auditar_manual`: 129 "basta", 0 ausente, 0
  incompleto (linha S10 "art 21 T21"); `verif_independente`: 25 linhas com
  26 "NÃO LIDO" (os 24 de antes + a S10: Resoluções CSJT 174/288 e CNJ 125,
  sem texto na base); `conferir_rotulos`: igual à base; `grudados`: 7;
  `comparar_manifestos` contra `bak_2110`: só os 4 da RA 05, 0 artigo com
  linha diferente; `selos`: iguais à v27; `checar2`: nada perdido, `CHAVES`
  iguais.
- `ra05/neg_ra05.js`: palavra trocada no art. 10, VII; § 4º do art. 2º
  apagado (auditor e leitor independente); inciso VII apagado; art. 45-A
  apagado (auditor e leitor independente): 6 de 6 acusados. Artigo apagado
  que o texto do tópico cita aparece no auditor como **incompleto**, não
  ausente.
- `ra05/teste_ra05.js VELHO NOVO` (Edge sem interface): v27 → v28 com as 5
  chaves `trt4:` iguais; aviso, linha ("O material basta") e clique que abre
  o tópico; texto novo depois da Res. 415 e antes do quadro; caixa com os 4
  artigos e nenhuma nota de alteração; marcação num trecho que ficou continua
  pintada e a do parágrafo antigo aparece em "não foi achada" e continua
  guardada; 375 px e 820 px sem rolagem lateral (a tabela de 3 colunas rola
  por dentro no celular, padrão do app); console sem erro. Telas em
  `ra05/telas/`.

## Armadilhas novas

- A ferramenta Edit apagou o espaço do fim de um `new_string` ("37/2026 ·" +
  "Resolução CNJ" virou "·Resolução"): o leitor independente deixou de
  separar o trecho. Conferir separadores " · " depois de editar linha do
  manual (`grep -c " ·[^ ]"`).
- Heredoc no bash comeu as barras invertidas de novo; scripts com regex, só
  pela ferramenta Write/Edit.

# Adendo 24 — 2026-10-21 (Onda 3, partes B e C: resto do Lote 3 e 23 questões, v29)

## O pedido

"já fiz o commit, siga para as partes B e C" (v28 em `4b7536a`, PR #23,
merge `d32da4e`, publicada) e, depois de compactar, "continue de onde parou".
Tudo do trabalho fica em `scratchpad/lote3/` (o `PLANO.md` de lá tem o
registro do caminho).

## Fontes

- **IN 41/2018 do TST** (`fontes_2110/in41/in41.pdf`, JusLaboris handle
  138949, sem alteração registrada; download autorizado no plano de 06/10):
  `in41_extrair.js` → `leis/IN41.json`, 21 artigos; leitor B e `pdftotext`
  iguais; 4 rodapés tirados. A IN 41-A (Res. 223/2024, handle 242697) trata
  de recursos em IRDR/IAC e ficou fora.
- **Portal do TST** (`lote3/tst_portal.js`, Edge sem interface, nada gravado
  em disco; devolve `{SUM, OJ}` com situação e texto). Achados: Súmula 372, I,
  cancelada (2025); OJ 270 da SDI-1 cancelada; **OJ 227 da SDI-1
  (denunciação da lide) cancelada em 22/11/2005**.

## Erros antigos achados e corrigidos

- **`dpc-terceiros`, caixa "Pegadinha clássica — e o filtro trabalhista":**
  dizia que a IN 39/2016 considera inaplicáveis a denunciação da lide e o
  chamamento ao processo. A IN 39 não trata dos dois (arts. 2º e 3º
  conferidos no texto do app, `lote3/_in39b.js`). Trocada (item C8d), com a
  OJ 227 cancelada em 2005.
- **Base de leis** (`lote3/corrigir_base_2110.js`; `CORRECOES.json` com **13
  registros**; cópias em `bak_2110/`). Defeitos da marcação do Planalto ou do
  extrator, achados pela varredura de fim de linha e de começo de artigo
  (`lote3/_partidas.js`, `_rotulos_chave.js`):
  - CF 96, parágrafo único: "docaputdeste" → "do caput deste";
  - CF 100, § 11, e CLT 394-A, II e III: ",," → "," (vírgula dupla que
    sobra do trecho tachado);
  - CLT 416: "art. 422" repetido no fim, tirado;
  - CLT 511: vírgula solta, tirada;
  - CLT 579: "50,00" solto no fim, tirado;
  - Lei 11.419, art. 13: título "CAPÍTULO IV DISPOSIÇÕES GERAIS E FINAIS"
    grudado ao § 3º (vetado), tirado;
  - Lei 13.300, art. 1º: "Federa l." → "Federal." (fora de quadro);
  - Lei 11.416, art. 30: guardava a tabela do anexo; virou
    "Art. 30. (Revogado pela Lei nº 14.523, de 2023)" e saiu do quadro
    `leg-outros`.
  - Cada artigo corrigido que está em quadro ganha nota (`NOTA_ARTIGO` no
    gerador): CF:96, CF:100, CLT:394-A, CLT:416, CLT:511, CLT:579,
    L11419:13.
- **Fiéis ao Planalto, não mexidos:** artigos do CPC sem ponto final; Lei
  4.717, art. 4º, VIII, a ("regulamentares,, regimentais … gerias").

## O que entrou no `index.html` (`lote3/aplicar_lote3.js`, 23 recortes, prova por reversão; conteúdo em `lote3/conteudo.js`)

| Item | Tópico | O quê |
|---|---|---|
| C1 | `const-estado` | interpretação e vigência das normas constitucionais |
| C2 | `dt-remuneracao` | desvio de função, substituição e acúmulo (OJ 125, Súm. 159 e 275, CLT 456) |
| C3 | `dpt-especiais` | sentença normativa: extensão, cumprimento e revisão (CLT 868 a 875; Súm. 246 em caixa) |
| C4 | `dpt-pje` | princípios do processo do trabalho, audiências, IN 41/2018 |
| C5 | `dpc-especiais` | mandado de injunção e habeas data |
| C6a/b/c | `dpt-execucao` | caixa "Leitura integral" trocada (as leis agora estão no quadro); bens impenhoráveis e bem de família |
| C7 | `dt-dano` | renúncia e transação; igualdade e não discriminação (Lei 9.029) |
| C8a–g | revisão (semanas 1 a 6) | jurisdição; elementos da ação, classificação e relação processual; sujeitos do processo (síntese) e a correção da IN 39; fontes heterônomas × autônomas; poderes do empregador; *jus variandi* |

- **Manual:** S12 segunda + "IN 41/2018 do TST (a instrução inteira)" (marca
  continua "Material + leitura da norma": a Res. CSJT 185/2017 não tem texto
  na base); S12 quarta + "Lei 13.300/2016, arts. 2º, 3º, 8º, 9º, 12 e 13 ·
  Lei 9.507/1997, arts. 7º, 8º e 21"; S12 sexta: "Só na lei — o material não
  cobre" → **"O material basta"** (era a única linha "Só na lei"); S13 quarta
  (`dt-dano`) + "Lei 9.029/1995 (a lei inteira)".
- **Quadros novos:** IN 41 (21 artigos) em `dpt-pje`; Leis 13.300 e 9.507 em
  `dpc-especiais`; Leis 6.858, 5.584 (arts. 1º a 13, 19 e 20), 8.009 e CPC
  833 em `dpt-execucao`; Lei 9.029 em `dt-dano`.
- **23 questões** (`lote3/questoes.js`; o campo `provas` não vai para o app):
  DT80–82 `dt-seguranca` (ano 2015), DT83–85 `dt-coletivo` (2022), DT86–90
  `dt-dano` (2022; DT87 liga TST-S-276 e DT90 liga TST-S-443), PC63–68
  `dpc-especiais` (2022), PC69–74 `dpc-teoria` (2011). As DT entram antes de
  "LÍNGUA PORTUGUESA"; as PC antes de `PT_T65`. 520 → **543**.
- **Aviso no 03.1:** "Atualização de 21/10/2026 — material das semanas 11 a
  13, 23 questões novas e correções — vale desde já" (8 itens: semanas 11,
  12 e 13; revisão geral; questões; correção da IN 39; correções de quadro;
  minutos a mais). Antes do aviso da RA 05/2022.
- **Leitura a mais** (palavras novas ÷ 55): S11 seg +12 min, ter +8, qua +5;
  S12 seg +33, qua +19, sex +48; S13 qua +20; revisão geral +23.
- **v29** com `node versao.js INDEX SW 29`.

## Pipeline (`lote3/patch_pipeline_lote3.js`; cópias anteriores em `scratchpad/bak_2110b/`)

- Chave `IN41` em `gerar_lei_seca` (`NOME` 'IN 41/2018 do TST', `URL`
  handle 138949, `FONTE` 'TST', `NOTA_FONTE`), `auditar_manual`,
  `verif_independente`, `conferir_lei_seca` (`NOME2K`), `conferir_rotulos` e
  `triagem_rot`. Data de cópia 21/10/2026 também para a IN 41.
- `NOTA_ARTIGO` para os 7 artigos corrigidos que estão em quadro.

## Verificação

- Ensaio → real, `cmp` idêntico (`index.html` e `sw.js`).
- `lote3/provas.js`: **165 afirmações** do texto novo provadas contra a fonte
  (base de leis, IN 41, portal do TST, 04.2), 0 falha; negativos: 146 locais
  acusados, mais dígito, maiúscula e ausência, mais amostras do portal.
- `lote3/conferir_questoes.js INDEX lote3/questoes.js`: 23 questões, **116
  trechos** provados (lei da base, portal do TST ou 04.2), formato, âncora,
  cota e "art. N citado tem prova"; `--estragar`: 114 de 114 acusados.
- `conferir_lei_seca`: 0 falha, **2981 artigos** (+64; −L11416 30);
  `conferir_nada_perdido`: 0; `auditar_manual`: **130 "basta"**, 0 ausente,
  0 incompleto; `verif_independente`: 25 linhas com 26 "NÃO LIDO" (iguais à
  v28); `checar2`: nada perdido, `CHAVES` iguais; `conferir_rotulos`: 41
  diferenças, uma a menos que a base (L11419 13 ficou coerente); `grudados`:
  7; `selos`: iguais à v28; `comparar_manifestos`: só os 8 artigos
  corrigidos mudaram; RA 05 (`conferir_texto_ra05.js`): 31/0;
  `juris_1210/conferir_juris_tst.js`: **173 de 173**, "NENHUM PROBLEMA".
- Notas de correção aparecem nos quadros certos (`lote3/_notas.js`).
- `lote3/teste_lote3.js VELHO NOVO` (Edge sem interface): v28 → v29 com as 5
  chaves `trt4:` iguais; aviso com 8 itens; as 4 linhas do manual; as 11
  seções novas; os quadros (IN 41, 13.300/9.507, execução, 9.029; Lei 11.416
  sem a tabela e sem o art. 30; CF 96 corrigido); marcação na frase antiga da
  IN 39 vai para "não foi achada" e continua guardada, a de um trecho que
  ficou continua pintada; DT80 a PC74 na lista; 375 e 820 px sem rolagem
  lateral (as tabelas de 3 colunas rolam por dentro no celular); console sem
  erro. Telas em `lote3/telas/`.

## Armadilhas novas

- **Resíduo do extrator só aparece no fim ou no começo da linha:** "50,00",
  "art. 422", título de capítulo e tabela de anexo grudados. O conferidor
  compara a base com ela mesma e não vê. Antes de pôr lei nova no quadro,
  rodar a varredura de começo de artigo (`_partidas.js`) e de fim de linha.
- Texto antigo do app pode afirmar o que a norma não diz (IN 39 ×
  denunciação): provar também o texto vizinho ao que se acrescenta.

# Adendo 25 — 2026-10-21 (Onda 4: busca no material, v30)

## O pedido

"commit feito, prossiga com o plano" (v29 em `a2f243c`, PR #24, merge
`6360115`, publicada; raiz em ff). O próximo item do plano era a Onda 4. Com
ela, o plano do parecer (Adendo 21) termina. Trabalho em `scratchpad/busca_2110/`.

## O que entrou no `index.html` (`busca_2110/aplicar_busca.js`, 4 inserções, prova por subtração e por reversão; peças em `busca_2110/pecas.js` e `busca_2110/modulo_busca.js`)

- **Campo "Buscar no material"** no alto da página 04, entre o cabeçalho e a
  nota "Como ler os selos": campo (16 px, para o iPad não dar zoom), botão
  **Buscar**, botão **Limpar a busca** (só aparece com lista) e a explicação.
  A busca roda no Enter ou no botão, não a cada letra.
- **O que procura:** o texto da `.conteudo` dos 64 tópicos, com caixas de lei
  e quadros Lei seca. Ficam de fora as mesmas peças que o marca-texto pula
  (barra "Resolver agora", barra do marca-texto, quadro P17, botões) e os
  links "Planalto"/"TST" das caixas. Sem diferença de acento nem de
  maiúscula; "º" = "o", travessões = hífen, aspas curvas = retas, espaços
  colapsados. O trecho digitado é procurado inteiro, na ordem. Número no
  começo ou no fim não emenda em outro número ("art. 85" não acha 855-B).
- **Lista:** resumo ("“X”: N trechos em M tópicos"), um grupo por tópico na
  ordem da página (disciplina, nome, quantos trechos), três trechos por
  tópico e o botão "Mostrar todos os N trechos deste tópico" (até 200). Cada
  trecho diz onde está: "Texto · <último h5>", "Caixa de lei · <referência>"
  ou "Quadro Lei seca · <referência>" (referência longa cortada em ~90
  caracteres). No fim, sempre, o atalho "Procurar “X” na página 04.2 —
  Jurisprudência que cai →" (`irParaJuris({ busca })`; a 04.2 já tinha busca
  sem acento). "Súmula 463", por exemplo, não está em nenhum tópico, só na
  04.2.
- **Ida ao trecho:** `navegar()` (entra no histórico); abre o tópico; se ele
  estava fechado, espera o `toggle` (o marca-texto pinta as marcações na
  primeira abertura) ou 400 ms; relê só aquele tópico com nó e posição de
  cada caractere, acha o trecho pela posição (ou, se o texto mudou, pela
  ordem da ocorrência), rola sem animação até 30% da altura da tela e
  contorna o trecho com uma camada à parte (`.bz-camada`, `pointer-events:
  none`; não mexe no texto, então não briga com o marca-texto). O contorno
  some em 5 s (+1 s de esmaecer), ao voltar ou ao girar a tela. O botão
  "Voltar ao ponto anterior" devolve à lista no mesmo ponto.
- **Índice:** só textos (texto, forma de busca e marcos de "onde está" por
  tópico; ~2,6 milhões de caracteres). Começa a ser montado aos poucos (fatias
  de 12 ms) quando o campo ganha o foco; a busca termina o que faltar. Medido
  no Edge: ~300 ms no total; com o foco antes, a primeira busca levou 34 ms e
  as outras 3 a 9 ms. Nada é gravado no aparelho.
- **Aviso no 03.1:** "Atualização de 21/10/2026 — busca no material — vale
  desde já" (5 itens; "O que não muda": nada gravado).
- **v30** com `node versao.js INDEX SW 30`.

## Verificação

- Ensaio → real, `cmp` idêntico (`index.html` e `sw.js`).
- `busca_2110/teste_busca.js VELHO NOVO` (Edge sem interface; clique, digitação
  e Enter de verdade), **24 de 24, duas vezes**: v29 → v30 com as 5 chaves
  `trt4:` iguais (antes e depois do uso); aviso; Enter mostra a lista
  ("reconvenção": 29 trechos em 7 tópicos) e tira o foco do campo; "Mostrar
  todos"; clique num trecho de tópico fechado com marcação: abre, pinta a
  marcação, contorna "reconvenção" a ~30% da tela (texto debaixo do contorno
  conferido com `caretRangeFromPoint`); contorno some; Voltar devolve à
  lista no mesmo `scrollY`; os 5 trechos do grupo expandido caem em
  "reconvenção"; "art. 85" sem emendar; "art. 855-B" (6 em 3 tópicos);
  "Súmula 463" (nenhum, com atalho) → 04.2 com "Exibindo 1 de 226" e Voltar
  para a lista; Limpar; 375, 820 e 1280 px sem rolagem lateral e com tudo
  dentro da tela; console sem erro; os dois caminhos de leitura (índice
  rápido e o do trecho) dão o mesmo texto nos 64 tópicos (`internos.js`
  carrega uma cópia do módulo numa página à parte e expõe as funções).
- `busca_2110/neg_busca.js` (contorno 40 caracteres adiante e sem o limite de
  número): o teste acusou 4 falhas.
- Conferidores do material, iguais à v29 (o material não mudou):
  `conferir_lei_seca` 0 falha (2981 artigos), `conferir_nada_perdido` 0,
  auditor 130 "basta" e 0 ausente/incompleto, `verif_independente` 25/26,
  rótulos 41, grudados 7, `selos` igual à v29, `checar2` nada perdido e
  `CHAVES` iguais. `conferir_juris_tst` não rodou (nenhuma jurisprudência
  mudou).

## Armadilhas novas

- **Enter pelo protocolo de depuração precisa do caractere** (`text: '\r'`
  no `Input.dispatchKeyEvent`); sem ele o formulário não é enviado e os
  cliques seguintes do teste caem em outra página.
- **Link que quebra linha:** clicar no centro do `getBoundingClientRect()`
  pode cair fora do link; usar `getClientRects()[0]`.
- A 1280 px (não móvel) a barra de rolagem come 15 px: comparar com
  `clientWidth`, não com a largura emulada.

---

# Adendo 26 — 2026-10-22 (edital de 2026: análise, plano e grade nova, v31)

## O pedido

"O edital do concurso 2026 foi publicado!" O PDF está em
`Edital/Edital TRT4 2026.pdf` (SHA-256 `b41e3e84…1543`). Pedido: analisar só
o cargo 01, Analista Judiciário – Área Judiciária (sem especialidade; o
Oficial de Justiça fica de fora); fazer um plano para adaptar o aplicativo; a
prova é em 31/01/2027. O plano foi aprovado em 22/10
(`C:\Users\thale\.claude\plans\woolly-finding-squid.md`) com um ajuste: no
03.1 só o aviso mais recente fica aberto; os outros ficam no bloco fechado
"Avisos anteriores".

**Decisões do usuário (22/10):**
- PcD (TEA): vai se inscrever. O app ganha a lista de passos com os prazos.
  Os simulados completos continuam em 4 h, porque o parecer para o tempo
  adicional ainda é incerto.
- Recesso: sem trabalho de 20/12 a 30/01. 6 h por dia, de segunda a sábado,
  com um seletor para 8 h. 24/12, 25/12, 31/12 e 01/01 em meio período.
- Grade nova a partir de segunda, 02/11 (semana 10). A semana 9 não muda.
- Downloads: toda a lista do plano, mais o Código Civil compilado e o Manual
  de Redação da Presidência.

## Passo 1 — levantamento (`scratchpad/edital2026/`, registro em `PLANO.md`)

- **Anexo II do cargo 01:** 322 itens (CG 71, CE 251), extraídos com
  `pdftotext` (`extrair_anexo.js` → `anexo2_aj.json`) e conferidos por um
  segundo leitor (layout). Duas correções provadas: "Vice-Presidente" e o
  parêntese do item do Regimento.
- **Matriz edital × app** (`matriz.js`): para cada item, tópico, evidência
  (expressões procuradas no texto do tópico) e situação. Resultado: 152
  coberto, 34 parcial, 136 ausente. `conferir_edital_2026.js INDEX` dá
  "MATRIZ CONFERE"; teste negativo com `--estragar pt-pontuacao virgula`
  acusa. Tópicos que nenhum item aponta: `adm-improbidade`, `dt-ctps` e
  `info-hist`.
- **Prova e nota:**
  - CG 30 questões, peso 1; CE 30, peso 2. A nota objetiva precisa ser
    ≥ 6,00 (PcD: 4,80).
  - Estudo de caso: uma questão, de 20 a 30 linhas, nota de 0 a 10, mínimo
    de 6,00. Só é corrigido para os 800 primeiros da ampla concorrência e
    para todos os PcD e cotistas.
  - Nota final = objetiva + estudo de caso: o caso vale metade.
- **Composição estimada** (pelas provas do TRT-1 e do TRT-6 de 2025, no
  QConcursos): CG = Português 10 e 5 de cada uma das outras (Matemática/RL,
  Legislação, DH, Informática); CE = 5 de cada disciplina. Em `incidencia.md`.
- **Direito Civil nas 16 provas, por incidência:** parte geral 14/16,
  direitos reais 10/16, família 7/16, sucessões 7/16; obrigações, contratos e
  responsabilidade civil, menos. A ordem dos tópicos de Civil segue essa
  incidência.
- **Downloads** em `fontes_2210/`:
  - Planalto, leis: 9.099, 13.140, LINDB, 13.869, 13.019, 11.079, 12.527 e o
    Código Civil compilado;
  - Planalto, decretos dos tratados de DH: PIDCP, PIDESC, CADH, San
    Salvador, discriminação racial, CEDAW e o Protocolo, criança, pessoa com
    deficiência, diversidade biológica, patrimônio mundial, Estatuto de Roma
    e Carta da ONU;
  - TRT4: Código de Conduta compilado (Portaria 4.573/2023 com a 2.808/2025)
    e Regimento até a **RA 38/2026, de 1º/10/2026** (Assento Regimental
    05/2026). O edital cita a RA 31/2026 (Assento 04/2026);
  - CNJ: Res. 351/2020 compilada.
  - **Faltam:** Decreto 80.978/1977 (a URL do Planalto deu 404); DUDH;
    Declaração Americana; Declaração da ONU sobre povos indígenas; Res. CNJ
    492/2023; Res. CSJT 360/2023 e 368/2023 (o TRT-7 tem cópias, mas a fonte
    deve ser oficial); Protocolos para Atuação e Julgamento na JT; Manual de
    Redação.

## O que entrou no `index.html` (v31)

Script: `v31/aplicar_v31.js`, 108 trocas, cada uma com âncora única.
`bash v31/montar.sh` refaz o ensaio do zero a partir de `bak_2210/` (v30):
gerar → aplicar → v31 → pipeline da lei seca.

Antes de gravar, o script confere:
- os 20 avisos antigos estão inteiros;
- as 11 citações do edital entre aspas são trechos do edital;
- as semanas 1 a 9 do `CRONOGRAMA` são idênticas às da v30, e nenhum id
  sumiu;
- as datas das 22 semanas são contínuas e terminam em 30/01/2027;
- nenhum id de elemento ficou repetido a mais.

**Fontes dos textos:**
- `v31/semanas.js`: a grade das semanas 10 a 22;
- `v31/simulados.js`: provas de sábado com validade em 2026;
- `v31/textos_manual.js`: 03.1;
- `v31/textos_paginas.js`: páginas 01, 02, 03, 04 e 07;
- `v31/codigo_v31.js`: CSS e JS.

**Geradores:**
- `v31/gerar.js` → `out/cronograma.js`, `out/cartoes.html` e
  `out/relatorio.txt` (minutos por dia; os 322 itens têm bloco ou tópico já
  estudado);
- `v31/gerar_p02.js` → `out/edital_p02.html`.

### Grade (CRONOGRAMA)

22 semanas e 335 blocos:
- 6 blocos têm `fora:true`: saíram do edital, ficam gravados e não contam;
- 33 têm `ext:true`: só valem no modo de 8 horas;
- as semanas 17 e 18 têm `meios`.

Os ids das semanas 10 a 13 continuam; os novos entraram só por acréscimo.

Contam 296 blocos no modo de 6 horas e 329 no de 8.

Semana 22 com `marco:true`: o selo diz "Semana da prova" (antes, "Pico de
preparo").

### Grades da seção 3

| Fase | Semanas | Horas | ids |
|---|---|---|---|
| Fase 1 | 10 a 16 | 23h25 | `op-dia-1` a `op-dia-6` |
| Recesso | 17 a 22 | 6 h por dia, com trilho "Só no modo de 8 horas" | `op-rdia-1` a `op-rdia-6` |

- Notas do recesso: `#op-meio-notas` e `#op-sem22-notas`.
- A grade das semanas 4 a 9 fica num quadro fechado (`#op-grade-antiga`),
  com os ids renomeados para `op-dia9-N`.

### Modo do recesso

- Chave nova `trt4:recesso` (`CHAVE_RECESSO`, fora de `CHAVES`, como o
  marca-texto). Formato: `{v:1, hist:[{modo:'6'|'8', desde:'AAAA-MM-DD', em}]}`.
- A escolha vale da segunda seguinte. Duas escolhas antes da mesma segunda
  viram uma.
- Funções: `lerRecesso`, `modoDaSemana`, `modoEscolhido`, `escolherRecesso`,
  `blocosVisiveis`, `cronoTotal` e `renderRecessoModo`.
- O quadro `#recessoModo` fica na página 03. Depois de 25/01, os botões
  travam.
- "Zerar progresso" não apaga a chave. Ela entra na cópia de segurança
  (`PARTES`, `ROTULO`, `VALIDA`, `contar`).
- "Desfazer a última restauração" só mexe nas partes que a cópia traz: uma
  cópia de antes do v31 não apaga o modo.

### Carregador do cronograma

Guarda todos os ids marcados, inclusive os que não estão na grade. Os blocos
`fora` aparecem riscados e travados, "não conta no progresso".

### Metas e desempenho

- `METAS` por fase, até a semana 22. As fases de 2026 têm
  `bloco:BLOCO_2026` (Civil + Processo do Trabalho + Processo Civil).
- Funções `blocoCritico(fase)` e `nomesDoBloco`.
- `CADERNO` e `COTA_SIMULADO` com a estimativa de 2026 (60 questões, peso 90).
- A regra de corte da semana 7 só vale nas semanas 7 a 9.

### Simuladão

- `disciplina2026(q)` é usada só no sorteio:
  - LGPD, Lei 11.416 e LG23 (LAI) contam como Administrativo;
  - LG08 e LG24 (LBI), `adm-improbidade` e `dt-ctps` ficam fora.
- Civil, DH e Informática não têm questões ainda; a sobra é redistribuída.

### Simulados de sábado (`SIM_REAL`, semanas 5 a 21)

As semanas 10 a 21 usam os números de 2026:

| Semanas | Provas |
|---|---|
| 14 a 17 | TRT-6, TRT-1 e TRT-15 de 2025 e TRT-21 de 2023 |
| 18 a 21 | Oficial de Justiça: TRT-20 de 2024 e TRT-6, TRT-1 e TRT-2 de 2025 |

`SIM_RESERVA` ficou só com o TRT-7 de 2024 (75/80, crítico 17). A semana 22 é
o simuladão do app.

### 03.1

- **Lista de PcD** (`#opPcd`): 8 passos, com trechos literais do edital
  (itens 5.5 "a", "e" e "f" e 13.6). Fica aberta até 26/11.
- Aviso novo; os 20 anteriores ficam em `.op-avisos-ant`.
- Seção 2: prova de 2026, metas e meta do caso.
- Seção 3: as três grades.
- P11 a P14 no formato de 2026.
- Seção 6: "As vinte e duas semanas"; cartões das semanas 10 a 22, com os
  itens do edital em cada linha.
- Seção 8 atualizada.

### Painel "Hoje"

- `gradeDoDia()` escolhe a grade da fase. Também trata os meios períodos, a
  semana 22 e o dia da prova.
- "de 22" no lugar de "de 13".
- O atalho `data-op-dia` aceita id.
- P15-F (semana 13 em diante) no horário do P15 de cada fase; na semana 22,
  sem quinta.

### Páginas

- **01:** painel "A prova de 2026" (`#prova2026`).
- **02:** "Edital de 2026, item a item": 11 disciplinas e 322 linhas; o
  número da semana leva ao cartão.
- **03:**
  - título e subtítulo;
  - quadro do recesso;
  - metas;
  - carga de 2026, com a de 2022 e a calibragem num quadro fechado;
  - grade de 2022 fechada;
  - feriados de 02/11 e 20/11;
  - formato do caso de 2026;
  - "O recesso e a reta final", no lugar de "Se a prova cair em dezembro";
  - três ressalvas reescritas.
- **04:**
  - matérias novas `#mat-dciv` e `#mat-dh`, com plano e link da FCC;
  - Informática "de volta";
  - linha "Edital de 2026" com o peso em 8 matérias;
  - selo "fora do edital de 2026" em `adm-improbidade` e `dt-ctps`;
  - notas em `leg-outros` e `dpt-especiais`.
- **07:** seção "Edital de 2026"; textos de backup e zerar com o modo do
  recesso.
- **Menu:** atalhos para Civil, DH e Informática.

### Correções que vieram junto (estão no aviso)

- `JUR_SLOT` (04.2) dizia terça 17h45–18h00 e quarta 18h45–19h00; a grade
  sempre foi 17h30–17h45 e 18h30–18h45.
- `.lei-alt` com `nowrap` fazia a página 04 rolar 14 px de lado a 820 px
  (iPad em pé) com o tópico de improbidade aberto. O erro já existia na v30.
  Até 1.100 px, a nota agora quebra a linha.

### Textos de linhas reaproveitadas

`gerar.js`, `TEXTO_2026`:
- "Teoria no sábado da semana N" (N ≥ 10) virou "Teoria na quinta da semana
  N";
- "Duas metades de vinte minutos" virou "quinze", porque o bloco agora tem
  30 min;
- "Último item do programa de Português" foi trocado, porque há itens novos
  nas semanas 14 e 15.

### Outros

- `QC_DISCIPLINA` ganhou civ, dh e info.
- `QC_BLOCO` ganhou 109 blocos novos, pela disciplina; `s13-rlm` passou a
  `rlm/`.

## Pipeline e conferidores (no ensaio e no real, iguais)

- `auditar_manual.js` e `verif_independente.js` vão até a semana 22 (cópias
  de antes em `bak_2210/`).
- **Lei seca:**
  - 52 tópicos e **2742 artigos** (eram 2981);
  - saíram, como previsto e avisado: o quadro da Res. CSJT 415/2025 e da RA
    TRT4 05/2022 em `dpt-especiais`, a CLT 224 a 351 (disposições especiais)
    em `dt-jornada` e a Lei 13.146 inteira em `leg-outros`;
  - entraram os arts. 926 a 928 do CPC em `dpt-recursos`;
  - nenhum artigo que ficou mudou de texto (`comparar_manifestos`).
- **Resultados:**
  - `conferir_lei_seca` 0 falha;
  - `conferir_nada_perdido` 0 faltando, com a exceção declarada "fora do
    edital de 2026 (Lei 13.146)", 5 artigos;
  - auditor: 287 linhas, 207 "basta", 0 ausente e 0 incompleto;
  - `verif_independente`: 18 "NÃO LIDO", todos de prosa;
  - `--tambem-leitura`: 0 falta;
  - rótulos: 37 diferenças, todas da base (as que sumiram eram da LBI);
  - grudados: 6, as remissões conhecidas (a 7ª era da LBI);
  - `selos.js`: os mesmos 5 descritivos;
  - `checar2`: nenhum id de bloco ou questão perdido, `CHAVES` iguais;
  - `conferir_edital_2026` sobre o ensaio: "MATRIZ CONFERE", com teste
    negativo. Ele regrava `edital2026/blocos.json` e `topicos.json`; as
    saídas dos geradores ficam idênticas.

## Testes

- **`v31/teste_v31.js VELHO NOVO`:** 60 de 60. Datas simuladas por
  `Page.addScriptToEvaluateOnNewDocument`. Cobre:
  - a atualização sem perda;
  - id desconhecido preservado ao clicar;
  - a página 03;
  - o seletor de 6 ou 8 h: escolha, data, 33 blocos, meio do recesso, trava;
  - a cópia de segurança, sem download real, com zerar, restaurar e
    desfazer antigo;
  - a lista de PcD, inclusive fechada depois de 26/11;
  - o painel "Hoje" em 9 datas, com o clique medido na tela;
  - cartões e avisos;
  - desempenho na semana 8 e na 10;
  - 30 sorteios do simuladão;
  - o formulário do simulado;
  - a 04.2;
  - as páginas 02, 01 e 04;
  - 375 e 820 px sem rolagem lateral, com todos os tópicos abertos;
  - o console.
- **`busca_2110/teste_busca.js`:** agora lê a versão e o aviso do próprio
  arquivo novo, e "art. 855-B" dá 5 trechos (o 6º era o art. 21 da Res. 415).
  Resultado: TUDO CERTO.
- `juris_1210/teste_marca_1210.js` (com caminho absoluto): 0 marcação fora
  do lugar.
- `meta_1710/teste_barras_1710.js`: 13 de 13.
- Capturas para revisão: `v31/telas_v31.js`.

## Armadilhas novas

- `returnByValue` do protocolo de depuração não serializa `dataset`, que vem
  `{}`. Ler o campo antes de devolver.
- `teste_marca_1210.js` e `teste_barras_1710.js` precisam de caminho
  absoluto. Com caminho relativo, o `localStorage` dá `SecurityError`.
- `conferir_edital_2026.js` regrava `blocos.json` e `topicos.json` com o
  arquivo que recebe.
- `aplicar_lei_seca4.js` só confere a frase dos números no aviso de 21/09;
  não muda aviso nenhum.
- `node -e` com `\s` e `\/` de novo: usar Write ou Edit.

---

# Adendo 27 — 2026-10-22 (material da semana 10 do edital de 2026, v32)

## O pedido

"Commit feito. Pode prosseguir": o primeiro lote do plano de 22/10, com o
conteúdo da semana 10 (02/11 a 07/11), para publicar até 31/10. O v31 foi
mesclado no PR #26 (`78d9818`) e está publicado. Downloads autorizados em
22/10: os três PDFs do CERT.br ("Baixar os três PDFs").

## O que entrou no `index.html` (v32)

Scripts em `scratchpad/v32/`. `bash v32/montar.sh` refaz o ensaio do zero a
partir de `bak_2210/index_v31.html`: fase A → `edital2026/topicos.js` →
`v31/gerar.js` e `v31/gerar_p02.js` → fase B → versão 32 → pipeline da lei
seca. Desde a v32 o `montar.sh` usa `set -e -o pipefail` (antes, um `| tail`
escondia a falha de uma etapa).

### Texto (fase A, `v32/conteudo.js`)

- **Direito Civil (`mat-dciv`):**
  - `civ-lindb`: "LINDB — vigência, revogação, lacunas, interpretação e a
    lei no tempo e no espaço", com quadro Lei seca dos arts. 1º a 19 do
    Decreto-Lei 4.657/1942;
  - `civ-pessoas`: "Pessoa natural: personalidade, capacidade, direitos da
    personalidade e ausência", com quadro dos arts. 1º a 39 do Código Civil.
- **Direitos Humanos (`mat-dh`):** `dh-teoria`, "Teoria geral: evolução,
  fundamentos, fontes, características, gerações, interpretação e colisão",
  com quadro da CF (arts. 1º, 4º e 5º, inteiros pela regra do quadro).
- **Informática (`mat-info`):** `info-seguranca`, "Segurança da informação:
  pragas virtuais, aplicativos de proteção, dois fatores e senhas", sem lei;
  as definições seguem a Cartilha de Segurança para Internet do CERT.br e os
  fascículos "Códigos maliciosos" e "Autenticação" (`fontes_2210/certbr/`,
  texto por `pdftotext` e `v32/texto_certbr.js`, que recompõe os acentos).
- **`adm-atos-poderes`:** seção "Poderes hierárquico, disciplinar e
  regulamentar; deveres do administrador", antes de "Conceito de ato
  administrativo…", com a pegadinha CE-NO-RE do art. 13 da Lei 9.784.
- Trocas P1 a P4: o plano das matérias diz "no material (semana 10)".
- Os quatro tópicos novos têm o selo "Novo no edital de 2026"; `civ-pessoas`
  e `civ-lindb` ganharam o selo "FCC recente" (`FCC_RECENTE`: [6, 7] e
  [4, 4], pelo assunto do QConcursos lido em 22/10).
- **Prova do texto:** `v32/provas.js`, 178 afirmações em pares [fonte, trecho
  da fonte, trecho do texto], 0 falha; teste negativo acusa. Fontes em
  `v32/fontes.js`: leis da base, `html:` (decretos do Planalto, por
  `v32/texto_html.js`), `cert:` (CERT.br), `web:` (citações conferidas no
  navegador, em `v32/fontes_web.json`: DUDH no site do UNICEF Brasil e
  Declaração de Viena no DHnet).

### Questões

- 21 novas, no fim do `QUESTOES`, sob o cabeçalho "EDITAL DE 2026 — semana
  10": CV01 a CV08 (Civil), DH01 a DH05, IF01 a IF05 (ano 2026) e DA98 a
  DA100 (poderes, ano 2015). 543 → 564.
- **Ano 2026:** assunto novo, que nunca caiu numa prova do TRT4. A etiqueta
  mostra "Edital 2026", e o filtro "Prova de referência" ganhou a opção
  "Edital de 2026 — assuntos novos". A página 07 explica.
- **Conferidor:** `node v32/conferir_questoes.js INDEX v32/questoes.js
  [--ja-aplicadas] [--estragar Q P]`.
  - Com `--ja-aplicadas`, uma questão que já está no INDEX tem de ser igual
    à nova, campo a campo (sem `provas`), em vez de dar "id repetido".
  - Prova com terceiro campo = número do artigo, para fonte sem número
    (tratado no decreto): `['html:cadh', '…', '29']`.
  - Resultado: 21 questões, 88 trechos provados. Negativos: prova estragada,
    questão gravada diferente, explicação sem prova do artigo citado.

### Atalhos

- `MATERIA_DA_SECAO` e `DISCIPLINAS_QC` ganharam as três matérias novas:
  abaixo do título aparecem "Banco de questões desta matéria" e o link da
  FCC no QConcursos.
- **QConcursos por assunto** (endereços abertos no site em 22/10, com o
  filtro da FCC; todos deram 200 e uma questão da FCC de 2026 no alto):
  - `QC_BLOCO`: `s10-dh` → `direito-internacional-dos-direitos-humanos`;
    `s10-info` → `seguranca-da-informacao`; `s10-da4` →
    `poder-normativo-poder-hierarquico-e-poder-disciplinar`. `s10-civ`
    continua na disciplina inteira, porque liga dois tópicos.
  - `QC_TOPICO` (novo): `civ-lindb` → `lei-de-introducao-as-normas-do-direito-brasileiro-lindb`;
    `civ-pessoas` → `personalidade-pessoa-natural-e-capacidade`. Vale no
    lugar dos links tirados dos blocos do tópico.
  - `urlQcDoBloco` passou a chamar `urlQcDe(v)`, que monta o endereço a
    partir de "disciplina/assunto".

### Grade, cartões e página 02 (fase B)

- **`v31/semanas.js`** (patches `v32/patch_semanas_v32.js`, `patch_v32c.js`
  e `patch_v32d.js`):
  - semana 10: `s10-civ` com `anc: 'civ-lindb'` e `anc2: 'civ-pessoas'`;
    `s10-da4`, `s10-dh` e `s10-info` com âncora no tópico, leitura de lei e
    `nota` (o que ler em cada dia); as quatro passam a "O material basta";
  - `s10-dh`, nota de carga: "No quadro Lei seca, leia só o art. 1º, III, o
    art. 4º, II, e o art. 5º, §§ 2º e 3º" (o quadro tem 2.387 palavras);
  - quatro linhas passam a "Material em preparo", porque falta um ponto do
    edital (veja "Lotes", abaixo): `s10-da2` (semana 11) até 07/11;
    `s13-dt` e `s13-dpt` até 21/11; `s14-rlm` até 28/11.
- **`v31/gerar.js`:**
  - `anc2` (segundo link de tópico na linha) e `nota` (fora de `op-arts`,
    que o auditor lê como lista de artigos);
  - a marca explícita vale também nos blocos `reusa`; a nota "O texto deste
    ponto entra no material até DD/MM" entra também neles
    (`avisoPreparo`).
- **`v31/gerar_p02.js`** — data de "Em parte — completa até":
  - Agora é a do primeiro bloco "Material em preparo" do item. Antes era a
    do primeiro bloco qualquer; com isso, 4 itens diziam "completa até
    31/10", e a v32 não completa nenhum deles (um, o discurso indireto
    livre, já estava no material; a matriz é que estava errada).
  - `POR_QUESTOES` (CG-MAT-01, 02 e 04): "Em parte — o resto é por
    questões".
  - `TEXTO_EM` (CE-DT-03: 21/11): texto que entra num tópico já estudado.
  - Item "em parte" ou "ausente" sem data: erro, e o arquivo não é gravado.
- **Matriz:** `v32/patch_matriz_v32.js` (CG-DH-01 a 05, CG-INFO-09,
  CE-CIV-01 a 03, CE-ADM-06 e 07 cobertos; CE-ADM-05 parcial; CE-CIV-04 e 05
  → `novo:civ-pj`) e `patch_v32c.js`: CG-LP-07 coberto, porque a seção
  "Discurso direto, indireto e indireto livre" está em `pt-interpretacao`.
  Resultado: **164 coberto, 32 parcial, 126 ausente**.
- **Página 02:** 20 itens mudaram da v31 para a v32 (`v32/dif_p02.js VELHO
  NOVO`): 12 viraram "No material", o LINDB virou "Em parte", e 7 tiveram a
  data ou o rótulo de "em parte" corrigidos.
- `edital2026/topicos.js`: o nome da matéria vem do texto do `<h3>` antes do
  `<span>`, porque o caminho dos cartões das matérias novas saía vazio.

### Aviso

"Atualização de 22/10/2026 — material da semana 10 — vale desde já", com 10
itens e "O que não muda". O da v31 é o primeiro de "Avisos anteriores (21)".

### Lei seca e base de leis

- **Chave nova `DL4657` (LINDB):**
  - `leis/DL4657.json` e `.txt`;
  - NOME "Decreto-Lei 4.657/1942 (LINDB)", URL `del4657compilado.htm`;
  - na lista de chaves de `gerar_lei_seca`, `auditar_manual`,
    `verif_independente`, `conferir_lei_seca`, `conferir_rotulos` e
    `triagem_rot` (`v32/patch_pipeline_v32.js`).
- **Correções na base (`CORRECOES.json`, agora 15 registros):**
  - no art. 7º da LINDB, o "º" do § 6º vem tachado na página do Planalto.
    Ficou "§ 6º O divórcio", com `NOTA_ARTIGO 'DL4657:7'`;
  - no CC, o "o" dos ordinais estava separado do número: 430 trocas em 184
    artigos (`v32/corrigir_base_v32.js`). A prova mostra que só os espaços
    mudaram.
- **`gerar_lei_seca.js`:**
  - tabela `DONO` (`patch_pipeline_v32b.js`): numa linha com dois tópicos,
    a LINDB vai para `civ-lindb` e o CC para `civ-pessoas`;
  - linhas "Material em preparo" com tópico também dão quadro
    (`patch_pipeline_v32c.js`). Sem isso, os quadros já publicados de
    `adm-controle-servicos` e `dt-coletivo` sumiriam quando as linhas deles
    passaram a "em preparo".
- **Resultado:**
  - 55 tópicos com quadro e 2.812 artigos (eram 52 e 2.742);
  - 3 quadros novos (`civ-lindb` com DL4657 ×19; `civ-pessoas` com CC ×39;
    `dh-teoria` com CF ×3) e nenhum removido;
  - `adm-atos-poderes` ganhou a Lei 9.784, arts. 11 a 15, a CF, arts. 49 e
    84, e a Lei 8.112, arts. 116, 128 e 143.
- `rotulos_base_0710.txt`: + "DIFERE civ-lindb DL4657 18". O link
  "Vigência" do Planalto fica antes do "§ 2o", e o quadro está certo.

### Conferência de que nada some (fase A)

`aplicar_v32.js` agora prova o que antes só dizia num comentário: toda
linha do arquivo de entrada continua no de saída (contando as repetidas),
menos as linhas que as trocas declararam (`tocar`, linhas inteiras). Teste
negativo: `node v32/neg_linhas.js` gera um aplicar que apaga "Vinte e duas
semanas", e a conferência acusa.

## Lotes futuros — o que a v32 acrescentou ao que cada um tem de trazer

Os itens abaixo eram "em parte", mas nenhum bloco trazia o texto que falta.
A v31 os dava como completos em 31/10 ou com a data do primeiro bloco.

| Lote | Até | Tópico | Ponto do edital |
|---|---|---|---|
| v33 | 07/11 | `adm-controle-servicos` (linha `s10-da2`, semana 11) | CE-ADM-28: direitos dos usuários (Lei 13.460/2017; Lei 8.987, art. 7º) |
| v35 | 21/11 | `dt-coletivo` (`s13-dt`) | CE-DT-25: categoria diferenciada |
| v35 | 21/11 | `dpt-recursos` / `dpc-precedentes` (`s13-dpt`) | CE-DT-33 e CE-DPT-38: listas das súmulas vinculantes; CE-DPT-35: uniformização no processo do trabalho |
| v35 | 21/11 | `dt-relacao` (já estudado; `TEXTO_EM`) | CE-DT-03: trabalho eventual |
| v36 | 28/11 | `rlm-proposicoes` (`s14-rlm`) | CG-MAT-03: validade de argumentos |

Ao entregar cada um, a linha volta a "O material basta" e o item vira
"coberto" na matriz.

## Carga de leitura (55 palavras/min)

| Bloco | Minutos do bloco | Leitura | Observação |
|---|---|---|---|
| `s10-civ` | 135 | 108 | inclui os dois quadros (3.548 palavras) |
| `s10-dh` | 45 | 64 → cerca de 24 | só com a nota do cartão |
| `s10-info` | 45 | 18 | |
| `s10-da4` | 50 | 29 | |

## Conferidores e testes (no ensaio; o real é igual, `cmp`)

- `bash v32/conferir_tudo.sh [ARQ]`: todos os conferidores, saída em
  `v32/conf/`.
  - provas: 178 afirmações, 0 falha;
  - questões: 21 e 88 trechos;
  - matriz: "MATRIZ CONFERE";
  - sintaxe: 4 scripts e `sw.js`;
  - `conferir_lei_seca` (base e arquivo): 0 falha;
  - `nada_perdido`: 0 faltando;
  - auditor: 287 linhas, 207 "basta", 0 ausente e 0 incompleto;
  - `verif_independente`: 18 "NÃO LIDO", de prosa; com `--tambem-leitura`,
    21;
  - rótulos: 38;
  - grudados: 6;
  - manifestos: 0 artigo com linha diferente, só acréscimos;
  - selos: 9 divergentes, 4 descritivos novos;
  - `checar2`: nada perdido, `CHAVES` iguais.
- `v32/sintaxe.js INDEX SW`: compila cada `<script>`; o negativo com um
  ")" a mais acusa.
- `conferir_edital_2026.js --estragar civ-pessoas nascituro` acusa.
- **`node v32/teste_v32.js VELHO NOVO`: 40 de 40.** Cobre:
  - atualização v31 → v32 sem perda, com o marca-texto antigo pintado;
  - 21 questões, filtro 2026, resposta por clique, DA98 com "Prova 2015";
  - os quatro tópicos, com selos, atalhos e quadros;
  - os links do QConcursos por tópico, por matéria e no bloco de poderes da
    página 03;
  - a seção nova de atos e poderes e "Resolver agora";
  - marca-texto com o mouse num tópico novo, que volta depois de recarregar;
  - os cartões das semanas 10, 11, 13 e 14, com o link medido na tela;
  - os avisos;
  - a página 02, com o link medido na tela;
  - a busca de três termos novos;
  - marcar o bloco de Civil;
  - 375 e 820 px;
  - o console.

  Negativo (`v32/neg_tela.js`): sem o atalho de DH e com a etiqueta antiga,
  são 4 falhas.
- `busca_2110/teste_busca.js bak_2210/index_v31.html v32/ensaio.html`: TUDO
  CERTO. O número de tópicos agora sai do arquivo novo (são 68).

## Armadilhas novas

- **O menu rola a página suavemente até o topo.** Um clique logo depois
  cai em outro ponto. No teste, esperar o `scrollY` parar (`assentar`).
- Num link que quebra a linha, o centro da caixa toda pode cair fora do
  texto: clicar no primeiro retângulo (`getClientRects()[0]`).
- O marca-texto leva a seleção até a palavra inteira nas duas pontas.
- `gerar_p02.js` gravava a saída mesmo com erro, sem as linhas puladas;
  agora não grava.
- Trocar a marca de uma linha para "Material em preparo" tirava o quadro
  Lei seca do tópico (corrigido no gerador). Ao mexer em marca, comparar a
  lista de `id="ls-…"` antes e depois.
- `node -e` com `'\n'` dentro de aspas: virou quebra de linha de verdade.
  Usar Write ou Edit.

---

# Adendo 28 — 2026-10-23 (material da semana 11 do edital de 2026, v33)

## O pedido

"Commit concluído. Pode continuar": o segundo lote do plano de 22/10, com o
conteúdo da semana 11 (09/11 a 14/11), para publicar até 07/11. A v32 foi
mesclada no PR #27 (`5b3bcc2`) e está publicada; a pasta principal está em
`5b3bcc2`. Download autorizado em 23/10: a Lei 13.460/2017 do Planalto
(`fontes_2310/l13460/l13460.htm`, 69.906 bytes).

**Antes de começar:** a limpeza de temporários do Windows apagou, na noite de
22 para 23/10, uns 590 arquivos do scratchpad (inclusive quase toda a pasta
`leis/`). Restaurado com `robocopy <ferramentas-scratchpad> <scratchpad> /E
/XO` e provado refazendo a v32 (`v32/montar.sh` + `cmp` com o `index.html`
commitado: igual). Desde então, `robocopy` de volta ao fim de cada etapa.

## O que entrou no `index.html` (v33)

Scripts em `scratchpad/v33/`. `bash v33/montar.sh` refaz o ensaio do zero a
partir de `bak_2210/index_v32.html`: fase A → `edital2026/topicos.js` →
`v31/gerar.js` e `v31/gerar_p02.js` → fase B → versão 33 → pipeline da lei
seca. Os patches (`v33/patch_*.js`) foram aplicados uma vez e não estão no
`montar.sh`.

### Texto (`v33/conteudo.js`, provado por `v33/provas.js`: 333 afirmações)

- **Direito Civil:**
  - `civ-pj`, "Pessoa jurídica: espécies, existência, desconsideração,
    associações e fundações", com quadro dos arts. 40 a 69 do CC;
  - `civ-bens`, "Domicílio e bens: domicílio civil, classes de bens e bens
    públicos", com quadro dos arts. 70 a 103. O domicílio foi para
    `civ-bens`, como no assunto "Domicílio e Bens" do QConcursos.
  - Selos "FCC recente": `civ-pj` [6, 6] e `civ-bens` [5, 5].
- **Direito Administrativo:**
  - `adm-lindb` (depois de `adm-principios`), LINDB arts. 20 a 30, com quadro;
  - `adm-abuso` (depois de `adm-improbidade`), Lei 13.869/2019, com quadro dos
    arts. 1º a 38 e tabela dos 25 crimes em vigor (o art. 15-A, violência
    institucional, tem pena de 3 meses a 1 ano);
  - em `adm-controle-servicos`, a seção "Direitos dos usuários de serviços
    públicos: a Lei 13.460/2017" (antes de "Bens públicos: afetação…"), com
    os arts. 4º a 6º e 8º no quadro.
- **Direitos Humanos:**
  - `dh-tratados`: hierarquia (EC 45 e supralegalidade, STF), controle de
    convencionalidade (Recomendação CNJ 123/2022 na redação de 2026), IDC
    (CF, art. 109, V-A e § 5º) e sistema interamericano (CADH, art. 33). Sem
    quadro: caixas `div.lei` com o art. 5º (caput e §§ 2º a 4º) e o art. 109
    (caput, V, V-A e § 5º), e entradas em `escopos.js`;
  - `dh-onu`: Carta da ONU, Estatuto da CIJ (texto do Decreto 19.841/1945,
    com a grafia da época; trechos com defeito de digitalização só em
    paráfrase) e DUDH.
- **Legislação:** `leg-conduta` (depois de `leg-trt4`), Código de Conduta e
  Valores Éticos do TRT4, com quadro dos 29 artigos.
- **Informática:** `info-windows` (antes de `info-seguranca`), com atalhos e
  regras de nome de arquivo das páginas oficiais da Microsoft.
- Trocas P1 a P3 nos planos das matérias ("no material (semana 11)").
- **Fontes web** (`v33/fontes_web.json`, lidas no navegador, sem salvar
  cópia): DUDH (UNICEF Brasil), STF (SV 25, RE 466.343 e HC 95.967, por
  `fetch` na página do STF), CNJ (Recomendação 123/2022), Microsoft (atalhos;
  nomes de arquivo). Fonte nova `juris:ID` (cartão da 04.2) em
  `v33/fontes.js`.
- **Provas calculadas** em `v33/provas.js`: `calc:penas13869`,
  `calc:pena:N` (cada linha da tabela de crimes), `calc:artigos:LEI` e
  `calc:incisos:LEI:N` (as contagens "29 artigos" e "23 condutas").

### Questões

20 novas (564 → 584), no fim do `QUESTOES`: CV09 a CV14, DA101 a DA104, DH06 a
DH10, LG33, LG34, IF06 a IF08. Ano 2026, menos DA104 (tópico antigo:
2022). `node v33/conferir_questoes.js INDEX v33/questoes.js --ja-aplicadas`:
20 questões, 99 trechos.

### Atalhos e QConcursos

- `QC_TOPICO` aceita lista de `[assunto, rótulo]` (dois links em `dh-onu` e
  `info-windows`); assuntos novos para os oito tópicos, menos `leg-conduta`
  (sem assunto no QConcursos).
- `QC_DISCIPLINA` ganhou `penal` (`direito-direito-penal`), por causa do
  abuso de autoridade.
- `QC_BLOCO`: `s11-info` → `sistema-operacional`.
- Os nove endereços foram abertos no site em 23/10, com o filtro da FCC.

### Grade, cartões e página 02

- `v33/patch_semanas_v33.js` e `v33/patch_semanas_v33b.js`: as seis linhas
  da semana 11 com âncora (e `anc2`), leitura, nota e "O material basta". A
  linha reusada de controle (`s10-da2`) ganhou `artsMais` (Lei 13.460) e
  `nota`; `v31/gerar.js` passou a aceitar `artsMais` e `nota` em linha
  reusada.
- A nota de `s11-da` manda ler no quadro só a LINDB: com a parte geral da Lei
  13.869, a sexta dava 57 de 50 minutos.
- `v31/gerar_p02.js`: a data "Situação em …" virou a constante `SITUACAO`
  (23/10/2026).
- Matriz (`v33/patch_matriz_v33.js`): **177 coberto, 31 parcial, 114
  ausente**. CG-DH-28 fica parcial (os Protocolos da JT são da semana 15).
- Página 02: 14 itens mudaram (13 a "No material"; Carta da ONU a "Em
  parte — completa até 05/12").
- As linhas de sábado das semanas 11, 12, 13 e 15 trocaram o link "Direito
  Civil (disciplina inteira)" pelo do tópico `civ-pj`.

### Base de leis e pipeline

- **Chaves novas** `L13460`, `L13869` e `CONDUTA` (`v33/patch_pipeline_v33.js`):
  - na base;
  - nos scripts que leem `leis/`;
  - no gerador: nome, endereço, fonte, nota e data de cópia 23/10/2026;
  - no auditor e no leitor independente: "Portaria GP.TRT4 4.573/2023" e
    "Código de Conduta do TRT4" valem como `CONDUTA`.
- **`leis/CONDUTA.json`:** `v33/conduta_extrair.js`. O texto principal vem do
  PyMuPDF, por `v33/pdf_texto.py`, rodado com `python -P` (o `-I` desliga
  os pacotes do usuário, onde o PyMuPDF está). Conferências: o pdftotext,
  o leitor B e os 13 cabeçalhos de página tirados.
- **Correções na base** (`CORRECOES.json`, agora 17 registros):
  - L13869:9, o "’" final que vem do ato de promulgação;
  - CC:66, o "º" do § 1º, que estava tachado na página (`v33/patch_cc66.js`).
    Achado por `v33/tachados_curtos.js`, que procura, nas páginas, tachado
    de um sinal só.
- **`lei_seca_texto.js`** (cópia de antes: `bak_2210/lei_seca_texto_v32.js`):
  - "(alterado pela…)", em minúscula, sai como nota;
  - "Pena - …" depois de ". ; :" é linha própria (mudou o quadro da Lei 8.429,
    art. 19, e o da Lei 9.029, art. 2º; texto igual, provado por
    `comparar_manifestos`, e a marcação sobre a linha continua pintada);
  - "§ 1º I – II –" (parágrafo e incisos revogados) some.
- **`gerar_lei_seca.js`:** o `DONO` aceita faixa (`['CC', 40, 69]`); donas da
  semana 11: `civ-pj`, `civ-bens`, `adm-lindb` e `adm-abuso`.
- **`verif_independente.js`:** aceita inciso com letra ("V-A").
- **Resultado:** 60 tópicos com quadro e 2.954 artigos (eram 55 e 2.812); 5
  quadros novos e nenhum removido.

## Conferidores e testes (no ensaio; o real é igual, `cmp`)

- `bash v33/conferir_tudo.sh`:
  - provas: 333;
  - questões: 20 e 99 trechos;
  - matriz: confere;
  - sintaxe: ok;
  - lei seca: 0 falha;
  - nada perdido: ok;
  - auditor: 0 ausente e 0 incompleto, 213 "basta";
  - leitor independente: 18 "NÃO LIDO";
  - rótulos: 38;
  - grudados: 6;
  - manifestos: 2 artigos mudados, as linhas "Pena";
  - selos: 17, os 9 de antes e 8 tópicos novos;
  - `checar2`: ok.
- **`node v33/teste_v33.js VELHO NOVO`: 40 de 40.** Inclui uma marcação feita
  com o mouse na v32 sobre a linha "Pena" da Lei 9.029, que continua pintada
  na v33. Negativo (`v33/neg_tela.js`): 2 falhas, as plantadas.
- `busca_2110/teste_busca.js bak_2210/index_v32.html v33/ensaio.html`: TUDO
  CERTO.

## Carga de leitura da semana 11 (55 palavras/min)

| Dia | Bloco | Leitura | Tempo do bloco |
|---|---|---|---|
| Segunda | Civil: pessoa jurídica | 60 min | 75 min |
| Quarta | Civil: domicílio e bens | 40 min | 60 min |
| Terça | Direitos Humanos | 29 min | 45 min |
| Quinta | Código de Conduta (arts. 1º a 6º no quadro) | 41 min | 45 min |
| Quinta | Informática | 10 min | 45 min |
| Sexta | LINDB e abuso de autoridade | cerca de 45 min | 50 min |

O bloco de controle da Administração (terça, 90 min) já passava do tempo
antes da v33: o tópico tem 144 min de leitura. A v33 acrescenta uns 24 min.
Fica para o usuário decidir se esse bloco passa ao modo P17.

## Armadilhas novas

- A limpeza de temporários do Windows pode apagar o scratchpad. Fazer o
  `robocopy` ao fim de cada etapa e restaurar com `/XO`.
- Artigo com letra (15-A, 49-A): toda afirmação de contagem ou de "todos os
  artigos" tem de percorrer as chaves da base, e não números de 1 a N.
- O auditor exige o artigo inteiro, salvo quando há entrada em `escopos.js`
  (lei:artigo@tópico). Sem ela, artigo citado vira quadro inteiro (foi o
  caso dos arts. 1º, 4º e 5º da CF em `dh-teoria`, na v32).
- O PyMuPDF só funciona com `python -P` (o `-I` desliga os pacotes do
  usuário).
- Tachado de um sinal só na página do Planalto: rodar
  `v33/tachados_curtos.js` em toda página nova.
- Ao mexer em `lei_seca_texto.js`, refazer a versão anterior e comparar: a v32
  refeita mostrou as duas linhas "Pena" que mudariam.

---

# Retomada — estado em 2026-10-23 (ler primeiro depois de compactar a conversa)

## COMO RETOMAR (fazer nesta ordem)

1. Ler esta seção inteira, o **Adendo 28** (v33, semana 11, logo acima), o
   **Adendo 27** (v32, semana 10) e o **Adendo 26** (edital de 2026). Se o
   scratchpad tiver perdido arquivos, restaurar antes (memória
   appestudos-retomada: `robocopy … /E /XO` e refazer a última versão para
   provar). O plano aprovado em 22/10 está em
   `C:\Users\thale\.claude\plans\woolly-finding-squid.md` (o plano em ondas do
   parecer, Adendo 21, terminou na v30). O levantamento do edital está em
   `scratchpad/edital2026/PLANO.md`.
2. Conferir o estado real antes de mexer em qualquer coisa:
   - `git status --short` e `git log --oneline -3` no worktree (esperado:
     árvore limpa e último commit = o do Adendo 28, v33; em 23/10 o Adendo 28
     estava no worktree, esperando o commit, e o último commit era `1346849`,
     Adendo 27, v32);
   - `git fetch origin` e `git log --oneline -3 origin/main` (em 23/10 o
     `main` estava no PR #27, `5b3bcc2`, v32, publicada);
   - pasta principal: `git -C <raiz> merge --ff-only origin/main` depois de
     cada PR (a raiz não tem mais cópia solta do HANDOFF);
   - site publicado: `curl -sS https://thalessoffiatti-art.github.io/AppEstudos/sw.js | grep "const CACHE"`
     (esperado: `autos-do-estudo-v33` ou maior; a v33 tem de estar publicada
     antes de segunda, 09/11);
   - `node versao.js INDEX SW` no scratchpad (meta `versao-app` = `CACHE`).
3. Ver se o usuário já respondeu às decisões pendentes (abaixo). Não aplicar
   nenhuma delas sem a resposta.
4. **Próximo passo: v34, conteúdo da semana 12 (16/11 a 21/11), publicar
   até sábado, 14/11** (o usuário commita a v33 antes de 09/11; esperar o
   commit antes de mexer no `index.html`). As quatro linhas da semana 12 em
   "Material em preparo — chega até 14/11":
   - `s12-civ`: negócio jurídico (conceito, classificação, elementos,
     condição, termo e encargo, defeitos e invalidade), prescrição e
     decadência e prova (CE-CIV-07 a 13);
   - `s12-da`: Lei 13.019/2014, PPP (Lei 11.079/2004) e LAI (Lei
     12.527/2011) (CE-ADM-25, 26, 31 e 43). As Leis 13.019 e 11.079 estão em
     `fontes_2210/` (baixadas em 22/10); a 12.527 já está na base;
   - `s12-dh`: PIDCP e PIDESC, com os protocolos (CG-DH-09 e 10), nos
     decretos de `fontes_2210/`;
   - `s12-info`: Google Workspace (CG-INFO-02 a 04): páginas de ajuda do
     Google, lidas no navegador (salvar cópia pede autorização).

   **Como fazer**, pelo modelo da v33 (Adendo 28, `scratchpad/v33/`):
   - copiar `v33/` para `v34/` e trocar `conteudo.js`, `provas.js`,
     `questoes.js`, `aviso.js` e os patches;
   - `montar.sh` a partir do `index.html` da v33 commitada
     (`bak_2210/index_v33.html`);
   - lei nova: `extrair3.js` + `leitor_b.js` + `v32/varrer_v32.js` +
     `v33/tachados_curtos.js`, e entrada em `escopos.js` quando a linha pedir
     só parte de um artigo;
   - `conferir_tudo.sh`;
   - `teste_v34.js` no molde do `teste_v33.js`, com teste negativo;
   - carga de leitura a 55 palavras por minuto, com nota no cartão quando
     passar do bloco;
   - QConcursos por assunto, com os endereços abertos no site;
   - `SITUACAO` em `v31/gerar_p02.js` com a data da versão.

   Depois do lote, a marca da linha volta a "O material basta"
   (`v31/semanas.js`), a matriz é atualizada e `gerar_p02.js` é refeito. O
   gerador agora acusa um item "em parte" ou "ausente" sem bloco "em
   preparo".

   Os pontos que a v32 acrescentou aos lotes v35 e v36 estão na tabela
   "Lotes futuros" do Adendo 27.

   **Calendário dos lotes:**
   - v34 até 14/11, v35 até 21/11, v36 até 28/11, v37 até 05/12;
   - v38 até 12/12: semana 16 e cartões finais do recesso;
   - Civil: obrigações e contratos até 19/12; responsabilidade civil e
     empresa até 26/12.

   O que cada semana pede está em `v31/semanas.js` (blocos com `nova:true`
   e `marca`) e na página 02.

   **Ao terminar qualquer versão:** HANDOFF (adendo e Retomada), memória,
   `robocopy` da cópia dos scripts e, depois do PR, `--ff-only` na pasta
   principal.

## ESTADO EM 23/10/2026 — v32 publicada (PR #27); v33 (semana 11) pronta, esperando o commit

- **v33 (Adendo 28):** `index.html`, `sw.js` e este arquivo no worktree,
  testados e iguais ao ensaio (`cmp`). Tem de estar publicada antes de
  segunda, 09/11, quando começa a semana 11.
- **v32 (Adendo 27):** mesclada no PR #27 (`5b3bcc2`) e publicada
  (`autos-do-estudo-v32`); a pasta principal está em `5b3bcc2`.
- **Decisão que espera o usuário:** o bloco de controle da Administração da
  terça da semana 11 (90 min) tem cerca de 168 min de leitura. Já passava do
  tempo antes da v33. Passar ao modo P17 (questões primeiro) é decisão dele.

## ESTADO EM 21/10/2026 — v29 publicada; v30 pronta, esperando o commit (registro)

- **Commits:** Lote 2 em `d453bce` (v20); modo de estudo em `f77b6c8` (v21,
  PR #16); faixa de versão nova em `9d8cddf` (v22, PR #17); súmulas cortadas e
  marca-texto em `ea4991e` (v23, PR #18); botão do marca-texto acima em
  `e8540d4` (v24, PR #19); barras "Contra a meta" em `734f332` (v25, PR #20).
  Onda 1 do parecer em `8a2a6fa` (v26, PR #21, merge `1c72dfa`); backup em
  `5238f05` (v27, PR #22, merge `4c185c4`); RA TRT4 05/2022 em `4b7536a`
  (v28, PR #23, merge `d32da4e`); Lote 3 e 23 questões em `a2f243c` (v29,
  **PR #24, merge `6360115`**). Todos no `main`. O GitHub Pages servia a
  **v29** em 21/10.
- **Pasta principal:** em `6360115` (v29) desde 21/10, por `--ff-only`.
- **Pendente de commit:** Adendo 25, Onda 4, **v30** (`index.html`, `sw.js`
  e este arquivo). Testado. Esperar o commit antes de mexer no `index.html`
  de novo.
- Próxima versão: **v31** (`node versao.js INDEX SW NN`).
- **iPad:** desde a v23 as versões chegam pela faixa "Versão nova do
  aplicativo pronta" (a v22 instalou a faixa). **Nunca** sugerir apagar o ícone nem
  "Dados de Sites", porque isso apaga o progresso, que só existe no aparelho.

### Calendário (semana N começa em 31/08 + 7 × (N − 1)) — desde a v31, 22 semanas

| Semana | Começa | Observação (v31) |
|---|---|---|
| 9 | 26/10 | última da grade de 2022; quarta 28/10, ponto facultativo |
| 10 | 02/11 | **grade do edital de 2026** (Finados: grade normal); Civil, DH e Informática; simulado TRT-20 2024 (60 válidas) |
| 11–13 | 09/11–23/11 | conteúdo novo pela página 02; semana 13: P15-F e refazer casos |
| 14–16 | 30/11–14/12 | fim da Fase 1 (23h25); 25/11 prazo PcD; 26/11 pagamento |
| 17–18 | 21/12–28/12 | recesso, 6 h ou 8 h; meio período em 24/12, 25/12, 31/12 e 01/01 |
| 19–20 | 04/01–11/01 | recesso; conteúdo novo só até 16/01 |
| 21 | 18/01 | revisão final |
| 22 | 25/01 | semana da prova: quinta 28/01 simulado final, sexta leve, sábado 30/01 véspera; prova domingo, 31/01, à tarde |

Calendário da v30 (registro):

| Semana | Começa | Observação |
|---|---|---|
| 7 | 12/10 | começam o P2 com marca-texto e, na quarta 14/10, o P17 (Direito do Trabalho com questões primeiro) |
| 8 | 19/10 | quarta 21/10: `dpc-provas`, com as 6 questões novas (PC57–PC62, v26) |
| 9 | 26/10 | blocos que receberam texto no Lote 2 |
| 10 | 02/11 | sexta 06/11: política judiciária (Res. CSJT 415/2025 e RA TRT4 05/2022, que entrou na v28; o PR tem de estar mesclado até 05/11) |
| 11 | 09/11 | blocos que receberam texto no Lote 3 (v29, publicada em 21/10) |
| 12 | 16/11 | quarta 18/11: `dt-seguranca` (P17) e `dpc-especiais` (questões novas na v29: DT80–82, PC63–68) |
| 13 | 23/11 | quarta 25/11: `dt-coletivo` e `dt-dano` (P17; questões novas na v29: DT83–90); revisão geral (PC69–74 em `dpc-teoria`); termina em 28/11 |

### Decisões que esperam o usuário (não aplicar sem resposta)

1. **RA TRT4 05/2022 — FEITO em 21/10 (Adendo 23, v28).** Downloads
   autorizados: RAs 58/2025 e 37/2026 (20/10); RAs 35/2025, 24/2022 e
   23/2024 (21/10). Histórico:
   - a compilada do TRT4 ("Republicação") traz as alterações das RAs 37/2023,
     07/2024, 10/2024 e 13/2025;
   - depois dela, pela pesquisa de atos do TRT4 (tipo Resolução
     Administrativa, trecho exato "Resolução Administrativa nº 05/2022"):
     - **RA 58/2025** (23/12/2025): tira o 4º "considerando", inclui o art.
       9º-A e altera os arts. 10, § 4º, 12, § 3º, e 18, § 1º, I e II;
     - **RA 13/2026** (04/05/2026, já salva em `fontes_0810/ra13/`): cria o
       CEJUSC-JT/2º GRAU/REVISTA e muda a coordenação, a competência
       territorial e os sete CEJUSCs de 1º grau;
     - **RA 37/2026** (30/09/2026): altera o art. 13;
     - as três mandam republicar a RA 05/2022, mas a pesquisa ainda entrega a
       republicação antiga;
   - **opções dadas:** (a) autorizar o download da RA 58/2025 e da RA 37/2026,
     para montar e provar a leitura dos artigos que importam (estrutura,
     NUPEMEC-JT/TRT4, CEJUSCs, competência, RPP), dizendo de qual RA vem cada
     redação; (b) esperar a republicação oficial;
   - **até lá:** a linha da sexta da semana 10 fica "Material + leitura da
     norma", com a Res. CSJT 415/2025 no quadro (17 artigos).
2. **Opção A — núcleo × consulta** (o usuário não entendeu; pediu uma imagem,
   que foi enviada: `scratchpad/opcao_a/opcao_A_ilustracao.png`, fonte
   `opcao_a/opcao_a.html`):
   - a linha e o quadro separariam "leia no bloco (núcleo)" de "consulta";
   - núcleo = artigo que o texto do tópico explica ou transcreve, ou que é
     `fund` de questão do app;
   - nenhum artigo sai do quadro; a linha continua citando a faixa inteira;
   - **exemplo:** quarta 14/10, CPC 312 a 368: 56 artigos, 113 min →
     núcleo de 15 artigos, 61 min, para 85 min de teoria;
   - **semanas 6 a 13, a 55 palavras/min** (teoria × leitura hoje → só
     núcleo): CPC 595 × 1.032 → 499; Administrativo 425 × 1.339 → 565;
     Legislação 455 × 818 → 345; ponto do edital 105 × 295 → 165;
     Constitucional 200 × 698 → 593 (A não resolve Constitucional);
   - medição: `carga_leitura.js` e `carga_nucleo.js` (rodar o auditor antes
     para gerar `aud.json` e `aud_normal.json`).
3. **Opção D — remanejar minutos: superada pela grade de 2026 (v31).** Era
   sobre a grade das semanas 4 a 9 (RLM 15 min de teoria → Constitucional;
   sexta: Processo do Trabalho 75 → 60 e ponto do edital 15 → 30).
4. **Edital de 2026 (v31), a confirmar com o usuário quando surgir:**
   - Regimento: o edital cita a RA 31/2026 (Assento 04/2026); o material vai
     seguir a RA 38/2026 (Assento 05/2026) e dizer o que mudou (ressalva na
     página 03). Bloco `s14-leg`, até 28/11;
   - tempo adicional de PcD: se o usuário conseguir o parecer, os simulados
     completos passam a 5 h (pedido dele: não estender antes);
   - registro da nota de cada estudo de caso (chave nova): adiado.

### O que já foi feito para a falta de tempo (para não refazer)

- **B, aplicada:** P17, Direito do Trabalho com questões primeiro, desde
  14/10. Aparece na seção 4, na grade de quarta, nos 10 cartões de quarta das
  semanas 7 a 13 e num quadro azul "Como estudar" no alto dos 12 tópicos
  `dt-*`.
- **C, aplicada:** marca-texto em todos os tópicos (`trt4:marcas`, fora de
  `CHAVES`, não apagado por "Zerar progresso"). O P2 marca em vez de copiar, e
  o passo de memória e o R2 usam "Esconder marcações".
- **Ritmo do usuário:** cerca de 55 palavras/min lendo e anotando. Ele leva
  mais de 1 hora num bloco de 30 min de teoria com cerca de 3.500 palavras.

## Onde estamos

- **Worktree:** `C:\Users\thale\Documents\GitHub\AppEstudos\.claude\worktrees\questoes-historico-in39-139338`.
- **Branch:** `claude/lei-8112-adicionais`. O usuário abre o PR para o `main`
  depois de cada commit; o GitHub Pages publica o `main`.
- **Último commit:** `fadc505` (Adendo 25, v30), mesclado pelo PR #25
  (`6290f56`). O Adendo 26 (v31) está no worktree, esperando o commit.
- **Pasta principal:** `C:\Users\thale\Documents\GitHub\AppEstudos`. Tem
  `Leis/`, `Provas/`, `Edital/` (o PDF do edital de 2026) e
  `Jurisprudência/sumulas_stj.md` (fora do git). Desde
  20/10 fica igual ao `origin/main` por `merge --ff-only` (inclusive este
  arquivo, que é o versionado; não copiar mais com `cp`).
- **Scratchpad** (pasta temporária desta sessão; os scripts e a base de leis
  estão lá):
  `C:\Users\thale\AppData\Local\Temp\claude\C--Users-thale-Documents-GitHub-AppEstudos--claude-worktrees-questoes-historico-in39-139338\987bfdd2-305d-4b53-8bfb-e15c943f2553\scratchpad\`.
  - `fontes_0610/`, `fontes_0710/` e `fontes_0810/`: PDFs e HTML baixados
    (`fontes_0810/`: Res. 415, `ra05/` compilada da RA 05/2022, `ra13/` RA
    13/2026);
  - `leis/`: a base, agora com `IN40.json`, `IN41.json`, `RES415.json`,
    `RES415AN.json` (Anexo da Res. 415), `RA05.json` e `CORRECOES.json` com
    13 registros;
  - `provas_raw/questoes.json`: as 240 questões das 4 provas do TRT4, em ordem
    de leitura (`provas_colunas.py`); `q.js ANO/N` imprime uma questão;
  - `faixa/`: versões e servidor do `teste_faixa.js`; `opcao_a/`: a
    ilustração da opção A;
  - `fontes_ra05/` (RAs 35/2025, 58/2025, 37/2026, 24/2022 e 23/2024, PDF e os dois textos) e `ra05/` (montador, conferidores, aplicação e testes da RA 05/2022; Adendo 23); `bak_2110/`: `index.html`, `sw.js` e scripts do pipeline de antes do Adendo 23 (e as leis de antes das correções do Adendo 24);
  - `fontes_2110/in41/` (PDF da IN 41/2018) e `lote3/` (conteúdo, provas, questões, conferidores, aplicação e teste do Adendo 24; `PLANO.md` com o registro); `bak_2110b/`: `index.html`, `sw.js` e scripts do pipeline de antes do Adendo 24;
  - `busca_2110/` (módulo, peças, aplicação, testes e telas da busca no material; Adendo 25); `bak_2110c/`: `index.html`, `sw.js` e manifesto da v29;
  - `edital2026/` (texto do edital, Anexo II em `anexo2_aj.json`, matriz, conferidor, incidência e `PLANO.md`), `fontes_2210/` (downloads de 22/10) e `v31/` (grade, simulados, textos, código, geradores, `aplicar_v31.js`, `montar.sh`, `teste_v31.js`, telas; Adendo 26); `bak_2210/`: `index.html`, `sw.js`, manifesto, `blocos.json`/`topicos.json` e scripts do pipeline da v30;
  - `juris_1210/`: Adendo 18 (aplicação, conferidor de jurisprudência do TST
    pelo portal, testes do marca-texto e da atualização); `bak_1210/`: o
    `index.html` e o `sw.js` de antes; `botao_1410/` e `bak_1410/`: Adendo 19; `meta_1710/` e `bak_1710/`: Adendo 20; `parecer_2010/` e `bak_2010/`: Adendo 21; `backup_2010/` e `bak_2010b/`: Adendo 22;
  - `fontes/` está **vazia**: o `tst.json` (Livro de Súmulas) sumiu. Os
    scripts antigos que o leem (`conferir_juris_caixas.js`, `fidelidade.js`,
    `conferir_casos.js`) não rodam mais; usar `juris_1210/conferir_juris_tst.js`.
- **Cópia de segurança do scratchpad (12/10/2026):**
  `C:\Users\thale\Documents\GitHub\AppEstudos\ferramentas-scratchpad\`.
  - 593 arquivos, 147 MB, conferidos por SHA-256 contra o original: scripts,
    base de leis, fontes baixadas, backups, `faixa/` e `opcao_a/`;
  - ficaram de fora só os perfis de navegador dos testes (`perfil-headless*`,
    1,7 GB, descartáveis);
  - fica **fora do git**, como `Leis/` e `Provas/`: aparece como `??` no
    `git status` da pasta principal e **não deve ser commitada**;
  - os scripts usam caminhos relativos e rodam de lá (conferido com
    `versao.js`, `conferir_lei_seca.js`, `auditar_manual.js` e `checar2.js`);
  - **sessão nova:** se o scratchpad acima não existir, trabalhar na cópia
    (ou copiá-la para o scratchpad novo);
  - **atualizar a cópia** depois de cada lote, sem os perfis (no PowerShell;
    o código de saída 1 do robocopy significa "copiado com sucesso"):
    `robocopy "<scratchpad>" "C:\Users\thale\Documents\GitHub\AppEstudos\ferramentas-scratchpad" /E /XD perfil-headless* /R:1 /W:1`.

## Lote 3 — até 08/11 (semanas 11 a 13 e semanas passadas) — FEITO em 21/10 na v29 (Adendo 24)

Lista original, mantida como registro (o que valeu está no Adendo 24; a IN
41-A ficou fora porque trata de recursos em IRDR/IAC):

1. **Terça, semana 11 (`const-estado`):** interpretação e vigência das normas
   constitucionais.
2. **Quarta, semana 11 (`dt-remuneracao`):** desvio de função (OJ 125 da
   SDI-1).
3. **Segunda, semana 11 (`dpt-especiais`):** dissídio coletivo — extensão,
   cumprimento e revisão.
4. **Segunda, semana 12:** princípios do processo do trabalho e IN 41/2018
   inteira. Ver também a IN 41-A, transitória, da Res. 223/2024. No
   JusLaboris, procurar o "texto vigente" (como na IN 40, handle 81842).
5. **Quarta, semana 12:** Lei 13.300 e Lei 9.507 no quadro (os JSON já
   existem).
6. **Sexta, semana 12:** Lei 6.858 inteira (JSON existe), Lei 5.584 inteira e
   Lei 8.009 (JSON existe). A linha passa a "basta".
7. **Quarta, semana 13 (`dt-dano`):** renúncia e transação; não
   discriminação, com a Lei 9.029 no quadro (JSON existe).
8. **Semanas 1 a 6, só acréscimo** (lido na revisão geral da semana 13):
   - jurisdição (`dpc-normas`);
   - elementos e classificação da ação, relação processual (`dpc-teoria`);
   - síntese dos sujeitos do processo (`dpc-terceiros`);
   - fontes autônomas × heterônomas (`dt-principios`);
   - poderes do empregador (`dt-relacao`);
   - jus variandi (`dt-alteracao`).

## Onda 3 — roteiro detalhado (A em v28; B e C em v29; plano do parecer, Adendo 21)

**A. RA TRT4 05/2022 — FEITA em 21/10 (Adendo 23, v28).** O roteiro abaixo
ficou como registro; o que valeu está no Adendo 23 (inclusive a RA 35/2025,
que o roteiro não previa):
1. Achar no site do TRT4 (pesquisa de atos: tipo Resolução Administrativa,
   trecho exato "Resolução Administrativa nº 05/2022") a **RA 58/2025**
   (23/12/2025) e a **RA 37/2026** (30/09/2026). Baixar cada uma numa pasta
   nova do scratchpad (`fontes_ra05/`). A compilada já está em
   `fontes_0810/ra05/` e a RA 13/2026 em `fontes_0810/ra13/`. Antes, ver se
   o TRT4 já publicou a republicação atualizada: se sim, usar ela.
2. Ler cada PDF com dois leitores (PyMuPDF `python -E -P` com `import pymupdf`,
   e `pdftotext -enc UTF-8`), como no `res415_extrair.js`. Montar a redação
   vigente dos artigos que importam: estrutura, NUPEMEC-JT/TRT4, CEJUSCs,
   competência e RPP. **Cada artigo diz de qual RA vem a redação.** Conferir
   também se outra RA posterior mexeu neles.
3. Entra no tópico `dpt-especiais` (onde está a Res. 415) e no quadro Lei
   seca. A linha da sexta da semana 10 pode passar de "Material + leitura da
   norma" a "basta" se o material cobrir o que a linha pede. Provar com o
   conferidor de afirmações (modelo `conferir_texto_res415.js`), com teste
   negativo.

**B e C — FEITAS em 21/10 (Adendo 24, v29).** Registro do roteiro:

**B. Questões novas — v29** (até 6 por tópico; modelo `parecer_2010/q_dpc_provas.js`
e `conferir_q_novas.js`, generalizado em `lote3/conferir_questoes.js`):
- `dt-seguranca` +3 (tem 3) e `dpc-especiais` +6 (tem 0): semana 12;
- `dt-coletivo` +3 (tem 3) e `dt-dano` +5 (tem 1): semana 13, junto com o
  texto novo do Lote 3 (renúncia e transação, não discriminação, Lei 9.029);
- `dpc-teoria` +6 (tem 0): revisão geral da semana 13.
- **Ids:** Direito do Trabalho continua de `DT80` em diante (o maior em
  21/10 era `DT79`); Processo Civil, de `PC63` em diante (o maior era `PC62`).
  Antes de gravar, conferir de novo que o id é inédito.
- **Ano:** o da prova do TRT4 em que o assunto do tópico caiu (selo "N/4
  provas" do tópico e Raio-X); a página 07 diz que "Cada questão traz o ano
  da prova em que aquele assunto apareceu".
- **Generalizar o `conferir_q_novas.js`** antes de usar: hoje ele só lê o
  `leis/cpc.json`. Trocar `provas:[['373', '…']]` por
  `provas:[['cpc:373', '…'], ['clt:223-G', '…'], ['l9029:4', '…']]`, que
  aponta a lei da base (`leis/clt.json`, `cf.json`, `L9029.json`,
  `L13300.json`, `L9507.json` etc.), e manter o teste negativo.

**C. Resto do Lote 3 — v29** (lista acima, itens 1 a 8). Itens com JSON na base:
Leis 13.300, 9.507, 6.858, 8.009 e 9.029. Lei 5.584 inteira: `leis/L5584.json`
existe (conferir se está completa). IN 41/2018: baixar o "texto vigente" no
JusLaboris (autorizado no plano de 06/10). Cada texto novo de doutrina segue
a regra: toda afirmação provada contra a fonte.

**D. Fechamento da v29:**
- aviso no 03.1;
- v29 com `versao.js`;
- conferidores de sempre (lei seca, nada perdido, auditor, independente,
  rótulos, grudados, selos, `checar2`, `conferir_juris_tst.js` se mexer em
  jurisprudência, `conferir_q_novas.js`);
- teste de atualização sem perda e teste de tela com geometria (375 e
  820 px).

**Onda 4 — v30 — busca no material — FEITA em 21/10 (Adendo 25).** Roteiro
original: campo no alto da página 04 que procura no texto dos tópicos e dos
quadros Lei seca (sem acento, sem maiúscula), com lista de resultados (tópico
+ trecho). O toque abre o tópico, rola até o trecho e o realça. Modelo de
leitor de texto: `indice()` do marca-texto. Testes com "art. 855-B", "Súmula
463" e "reconvenção" ("Súmula 463" só está na 04.2: a lista ganhou um atalho
para a busca de lá).

## Regras do usuário (valem sempre)

- Responder em português.
- O usuário commita e publica.
- Downloads pedem autorização. Os do plano já foram autorizados: Regimento,
  Leis 6.019, 12.023, 8.009, 9.029, 13.300 e 9.507, IN 38, 40 e 41,
  Resoluções CSJT 174 e 288 e RA TRT4 05/2022; em 08/10, a Res. CSJT 415/2025
  e a RA TRT4 05/2022 compilada; em 20/10, as RAs TRT4 58/2025 e 37/2026;
  em 21/10, as RAs TRT4 35/2025, 24/2022 e 23/2024; **em 22/10, toda a lista
  do plano do edital de 2026** (leis, decretos dos tratados de DH, CNJ 351 e
  492, CSJT 360 e 368, Protocolos da JT, Código de Conduta e Regimento do
  TRT4), mais o Código Civil compilado e o Manual de Redação da Presidência.
  Páginas de ajuda da Microsoft e do Google são lidas no navegador; salvar
  cópia pede autorização.
- **Nunca apagar dado salvo:** ids de bloco e de questão, nomes de disciplina,
  `CHAVES` e chaves `trt4:` só por acréscimo (`trt4:marcas` e, desde a v31,
  `trt4:recesso` ficam fora de `CHAVES` e "Zerar progresso" não as apaga).
- **Carga:** 23h25 por semana até 19/12; no recesso (21/12 a 30/01), 6 h por
  dia de segunda a sábado, ou 8 h no modo escolhido na página 03; meio
  período em 24/12, 25/12, 31/12 e 01/01.
- Mudança de grade vale da segunda seguinte; semanas já estudadas não são
  reescritas.
- Textos literais.
- Toda mudança ganha aviso no topo do 03.1 ("O que muda / O que não muda").
  **Só o aviso mais recente fica aberto;** os outros ficam no bloco fechado
  "Avisos anteriores" (`.op-avisos-ant`), do mais novo para o mais antigo, e
  o texto de nenhum aviso muda.
- O usuário é a pessoa que estuda; é autista: previsibilidade, textos
  literais, datas e horários exatos.
- **Lei transcrita:** fiel. "Não podemos correr o risco de erros passarem
  batidos."

## Como editar e conferir

1. **Edição:** script Node com recortes posicionais e contagem exigida, prova
   por reversão e gravação em CRLF. Modelos: `aplicar_lote2.js` e
   `aplicar_lote2b.js`.
2. **Ensaio:** sempre numa cópia antes (`ensaio.html`). Depois, aplicar no
   real e exigir `cmp` igual ao ensaio.
3. **Pipeline da lei seca** (desde a v31, o auditor e o leitor independente
   vão até a semana 22):
   1. `node auditar_manual.js "$W" --sem-lei-seca --json aud.json`
   2. `node gerar_lei_seca.js aud.json`
   3. `node aplicar_lei_seca4.js "$W"`
   - **v31:** `bash v31/montar.sh` faz tudo (geradores → aplicar → versão →
     pipeline) a partir de `bak_2210/` (a v30). Para a v32 em diante, partir
     do `index.html` commitado, com um `aplicar` próprio; `v31/gerar.js` e
     `v31/gerar_p02.js` continuam a ser as fontes dos cartões e da página 02
     (rodar `conferir_edital_2026.js` antes, para atualizar
     `edital2026/topicos.json`).
4. **Conferidores:**
   - `node conferir_lei_seca.js` e `node conferir_lei_seca.js "$W"`: 0 falha;
   - `node conferir_nada_perdido.js "$W"`: 0 faltando;
   - `node auditar_manual.js "$W" --json aud_normal.json`: 0 ausente e 0
     incompleto;
   - `node verif_independente.js "$W"`: só os 24 "NÃO LIDO"; com
     `--tambem-leitura`, também as linhas "Material + leitura" (0 falta; os
     "NÃO LIDO" são normas sem texto na base);
   - `node conferir_rotulos.js`: nada além de `rotulos_base_0710.txt`;
   - `node grudados.js`: só as 7 remissões conhecidas;
   - `node comparar_manifestos.js ./bak_…/manifesto_antigo.json ./lei_seca_manifesto.json`:
     só as mudanças previstas;
   - `node selos.js "$W"`: só os selos descritivos (`leg-*`, `info-hist`);
   - `node checar2.js [arquivo]`;
   - `node parecer_2010/conferir_q_novas.js "$W" DADOS.js` (questões novas:
     formato e trechos provados contra o CPC; `--estragar` para o teste
     negativo) e `node parecer_2010/conferir_notas_in39.js "$W"`;
   - RA 05/2022 (Adendo 23): `node ra05/ra05_montar.js` (refaz `leis/RA05.json`),
     `node ra05/ra05_conferir.js` (0 falha; `--estragar 1..5`),
     `node ra05/conferir_texto_ra05.js` (31 afirmações; `--estragar N`),
     `node ra05/neg_ra05.js` (6 de 6, sobre `ensaio.html`) e
     `node ra05/teste_ra05.js VELHO NOVO` (tela);
   - Lote 3 (Adendo 24): `node lote3/conferir_questoes.js "$W" DADOS.js`
     (questões novas de qualquer lei da base, do portal do TST ou da 04.2:
     `provas:[['clt:223-G','…'], ['tst:SUM-443','…'], ['juris:ID','…']]`;
     `--estragar Q P` para o negativo; `--sem-portal` pula o TST; substitui o
     `parecer_2010/conferir_q_novas.js`); `lote3/provas.js` (modelo de
     conferidor de afirmações com fontes mistas); `lote3/tst_portal.js`
     (`lerPortal()` → `{SUM, OJ}` com situação e texto, sem gravar);
     `node lote3/teste_lote3.js VELHO NOVO` (tela);
   - busca no material (Adendo 25): `node busca_2110/teste_busca.js VELHO NOVO`
     (24 verificações de uso, com geometria; tem de dar "TUDO CERTO"),
     `node busca_2110/neg_busca.js` (gera `ensaio_neg.html` estragado; o
     teste tem de acusar), `busca_2110/internos.js` (expõe as funções do
     módulo numa página à parte) e `node busca_2110/sonda.js ARQ [foco]`
     (tempos e resultados de termos de exemplo). Mudou o texto de algum
     tópico? A busca acompanha sozinha (lê a página); rodar o teste de novo;
   - `node juris_1210/conferir_juris_tst.js "$W"` (lê o portal do TST num Edge
     sem interface, uns 2 minutos): "NENHUM PROBLEMA" (173 de 173). Toda
     súmula, OJ ou tese nova do TST no app passa por ele: item transcrito vai
     até o fim; item de fora vai no campo `itens` do cartão ou no título do
     quadro ("Súmula N, I a III, do TST").
5. **Números atuais (v33):**
   - 60 tópicos com quadro e 2.954 artigos;
   - 287 linhas no manual, 213 delas "basta";
   - 76 tópicos na página 04;
   - 584 questões;
   - `CORRECOES.json` com 17 registros;
   - edital: 177 coberto, 31 parcial, 114 ausente;
   - rótulos: 38 diferenças; grudados: 6; leitor independente: 18 "NÃO LIDO";
   - selos: 17 divergentes (os 5 descritivos e os 12 tópicos novos, com
     "Novo no edital de 2026").

   Testes: `v33/teste_v33.js` (40) e `v33/conferir_tudo.sh`.

   **Números da v32 (registro):** 55 tópicos com quadro e 2.812 artigos; 207
   "basta"; 68 tópicos; 564 questões; 15 correções; edital 164/32/126.

   **Números da v31 (registro):** 52 tópicos com quadro, 2742 artigos; 287 linhas
   no manual: 207 "basta", 3 "Material + leitura da norma", 35 "Material em
   preparo", 42 "Método", nenhuma "Só na lei"; 335 blocos em 22 semanas (6
   fora, 33 do modo de 8 horas; contam 296 ou 329); 543 questões; 226
   enunciados na 04.2; `CORRECOES.json` com 13 registros;
   `verif_independente`: 18 "NÃO LIDO" (prosa); `conferir_rotulos`: 37
   diferenças, todas da base `rotulos_base_0710.txt`; grudados: 6;
   `conferir_nada_perdido`: 5 artigos da Lei 13.146 como exceção declarada
   (fora do edital de 2026). Edital: 322 itens, 152 coberto, 34 parcial, 136
   ausente (`conferir_edital_2026.js INDEX`).
   - **Testes da v31:** `node v31/teste_v31.js VELHO NOVO` (60 verificações,
     datas simuladas; "TUDO CERTO"); `busca_2110/teste_busca.js` agora lê a
     versão e o aviso do arquivo novo; `teste_marca_1210.js` e
     `teste_barras_1710.js` pedem caminho absoluto.
   - (v30: 2981 artigos, 130 "basta", 4 "Material + leitura", 159 blocos,
     `verif_independente` 25/26, rótulos 41.)
   - `conferir_lei_seca.js "$W"` compara com o manifesto **atual**: contra um
     arquivo antigo, acusa "DIFERE DO MANIFESTO" por construção.
   - O resumo final do `auditar_manual.js` conta só as linhas "basta"; o
     problema de uma linha "Material + leitura" aparece na própria linha.
6. **Lei nova do Planalto:**
   - `node extrair3.js fontes/x.htm leis/X.json`;
   - `node leitor_b.js leis/X.txt leis/X.json` (tem de dar "iguais");
   - conferir os artigos com letra contra os cabeçalhos da página.
   - **Antes de pôr lei da base num quadro**, varrer resíduo do extrator no
     começo do artigo (`lote3/_partidas.js`, `lote3/_rotulos_chave.js`) e no
     fim das linhas (número, remissão, título de capítulo ou tabela grudados).
     Correção vai em `leis/CORRECOES.json` e ganha `NOTA_ARTIGO` no gerador
     (modelo: `lote3/corrigir_base_2110.js` e `lote3/patch_pipeline_lote3.js`).
7. **Norma em PDF do TST:** modelo `in40_extrair.js` (dois leitores e
   conferência com o ato que alterou); `in41_extrair.js` (com rodapés). PDF justificado (palavra por linha):
   modelo `res415_extrair.js` (remonta parágrafos e prova que nada se
   perdeu). Texto novo sobre norma: um conferidor de afirmações como
   `conferir_texto_res415.js` (trecho da fonte × frase do texto, com teste
   negativo `--estragar N`).
8. **Testes:**
   - `teste_0710.js`, `teste_0810.js`, `teste_modo.js ARQ` (marca-texto e P17) e `teste_faixa.js` (faixa de versão nova, com servidor local), com Edge sem interface (`cdp.js`);
   - `juris_1210/teste_marca_1210.js ARQ` (marca-texto em trecho repetido e varredura de todas as palavras) e `juris_1210/teste_atualiza_1210.js VELHO NOVO` (atualização sem perda de dado, 04.2, 03.1, 375 px) e `botao_1410/teste_botao_1410.js ARQ` (posição do botão do marca-texto), `backup_2010/teste_backup.js` e `teste_backup_ipad.js` (backup, por HTTP com `servir.js`; nunca download real) e `meta_1710/teste_barras_1710.js ARQ` (barras "Contra a meta" medidas na tela). Teste de tela mede a geometria, não só o DOM. Caminhos Windows com `/` (`cygpath -m`). Nos testes, rolar com `behavior:'instant'`: a página tem rolagem suave e o clique cai fora do alvo;
   - **versão do app:** `node versao.js INDEX SW` (meta `versao-app` = `CACHE` do `sw.js`); para publicar versão nova, `node versao.js INDEX SW NN`;
   - `neg_res415.js`: modelo de teste negativo de norma nova no quadro;
   - nas buscas de texto, usar `\uXXXX`;
   - ao terminar, encerrar os processos Edge com `perfil-headless` na linha de
     comando.
9. **Atenção:** `node -e` e heredoc no bash comem barra invertida de regex.
   Para código com `\s` e `\d`, usar a ferramenta Write ou Edit, ou
   `String.raw`.
10. **Não passar `/dev/null` como arquivo de saída a um script Node** (por
    exemplo, `--json /dev/null`). O Git Bash converte para `nul`, e o Node
    grava um arquivo de verdade chamado `nul` na pasta. Ele só sai com
    `cmd /c 'del "\\?\<caminho>\nul"'`, porque `Remove-Item` acerta o
    dispositivo NUL, não o arquivo. Usar um arquivo descartável do
    scratchpad.

## Pendências e ideias em aberto

- **Edital de 2026 (v31):**
  - **Fontes que faltam** (baixar num lote, com a autorização de 22/10):
    Decreto 80.978/1977 (a URL do Planalto deu 404; procurar outra), DUDH,
    Declaração Americana, Declaração da ONU sobre povos indígenas, Res. CNJ
    492/2023, Res. CSJT 360/2023 e 368/2023 (de fonte oficial), Protocolos
    para Atuação e Julgamento na JT, Manual de Redação;
  - **semana 8:** `adm-atos-poderes` não tem os poderes hierárquico,
    disciplinar e regulamentar nem os deveres do administrador; entram na
    v32 (linha `s10-da4`);
  - **Regimento:** o material segue a RA 38/2026; dizer, artigo por artigo,
    o que o Assento 05/2026 mudou (semana 14);
  - **página 02** é estática: refazer `v31/gerar_p02.js` a cada lote (a
    situação dos itens muda) e trocar a data "Situação em";
  - **`SIM_RESERVA`:** só o TRT-7 2024. O TRT-23 2022 e as outras reservas
    antigas saíram do formulário (os registros feitos com elas guardam o
    rótulo e continuam no histórico);
  - **Civil, DH e Informática** não têm questões no banco: o simuladão
    redistribui as 15 vagas até as questões dos lotes chegarem;
  - **estudos de caso das semanas 14 a 22:** os enunciados e espelhos
    entram nos cartões com cada lote (as caixas já dizem a data);
  - **cartões do recesso:** os blocos estão na grade; os textos finais
    entram até 12/12 (v38).

- **RA TRT4 05/2022:** no quadro desde a v28 (Adendo 23), com texto montado
  pelo aplicativo. **Quando o TRT4 publicar a republicação atualizada**,
  conferir o `leis/RA05.json` contra ela (os arts. do quadro e os citados no
  texto) e trocar a nota da caixa.
- **Linha S10 de sexta:** "O material basta" desde a v28. É o bloco mais
  pesado da semana 10: Res. 415 (17 artigos, 1.128 palavras) + RA 05/2022
  (~720 palavras) para 15 minutos.
- **Tabelas de três colunas no celular:** rolam por dentro (padrão do app).
- **Resíduo do extrator fora dos quadros (não exibido, não mexido):**
  Decreto-Lei 200, chave 109, começa por "Art. 109 da Lei nº 3.470…" (mesmo
  defeito do art. 30 da Lei 11.416); palavras grudadas na CF 159 e 212-A, no
  ADCT 76 e 92-B e "n o" no CC. Corrigir se algum deles entrar num quadro.
- **Linha S12 de segunda:** continua "Material + leitura da norma" só pela
  Res. CSJT 185/2017 (sem texto na base).
- **Art. 34 do Regimento:** as alíneas "c" e "d" saem na mesma linha, porque
  falta ";" no próprio PDF. O texto está completo.
- **Na base, mas não pedidos:** Lei 11.101, arts. 6º-A a 6º-C e 7º-A, e
  Decreto-Lei 3.365, art. 4º-A.
- **`QC_BLOCO` da LBI e da Res. CNJ 400:** sem assunto.
- **Campo `ano` das questões:** é "estilo", não prova real.
- **`btnSoltarTopico`:** id duplicado antigo.
- **Tema 485 do STF:** tese não reconferida em 12/10 (a página do tema no
  portal do STF não mostra a tese). As outras 36 entradas literais do STF
  conferem.
- **Lei 13.146, arts. 104 e 114:** são artigos que alteram outras leis. O
  quadro mostra as linhas pontilhadas e as sobras "III -." do texto do
  Planalto. É fiel, mas difícil de ler.
- **Página 07, "Fontes":** o parágrafo de setembro ainda diz "220
  enunciados". Foi acrescentada a frase da Súmula 393, e o número antigo ficou
  como registro da data.
