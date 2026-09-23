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
