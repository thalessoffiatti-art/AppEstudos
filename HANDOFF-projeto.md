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
