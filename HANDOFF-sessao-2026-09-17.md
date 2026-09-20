# HANDOFF — AppEstudos (TRT4 / Analista Judiciário, Área Judiciária)

Documento para retomar o trabalho numa janela de contexto limpa.
Escrito em 17/09/2026, ao fim da sessão do histórico por questão e da Lei 8.112.
Complementa o `HANDOFF-projeto.md` da pasta principal, que descreve o projeto desde o início.

---

## 1. Situação do repositório

| Item | Valor |
|---|---|
| Repositório | `thalessoffiatti-art/AppEstudos` |
| Pasta principal | `C:\Users\thale\Documents\GitHub\AppEstudos` |
| Worktree de trabalho | `C:\Users\thale\Documents\GitHub\AppEstudos\.claude\worktrees\questoes-historico-in39-139338` |
| `origin/main` | **dce6f9b** — "Merge pull request #2 from thalessoffiatti-art/claude/historico-questoes" |
| Branch atual do worktree | **claude/lei-8112-adicionais**, commit **041c534**, já enviado (`git push` feito) |
| PR pendente | o do branch acima. **Ainda não foi aberto.** |

Commits recentes, do mais novo para o mais antigo:

- `041c534` Lei 8.112: fecha as lacunas de artigos e cobre os adicionais *(no branch, sem PR)*
- `dce6f9b` merge do PR #2 (histórico por questão e modal) — **já no main**
- `b7c5e04` Histórico por questão e confirmação modal no Zerar progresso
- `3523c38` Atualização com lei e jurisprudência (Raio-X, 04.2, manual 03.1, 116 questões)

### Como abrir o PR que falta

O **GitHub CLI (`gh`) não está instalado** nesta máquina e **não há Chrome conectado** ao Claude, então o PR precisa ser aberto pelo navegador. O link abaixo já preenche título e descrição a partir da mensagem do commit:

```
https://github.com/thalessoffiatti-art/AppEstudos/compare/main...claude/lei-8112-adicionais?expand=1
```

Para permitir que o assistente abra PRs sozinho depois:

```bash
winget install --id GitHub.cli -e
```

Em seguida, o login precisa ser feito pela pessoa usuária, porque envolve credenciais:

```bash
gh auth login
```

---

## 2. O que é o app

`index.html` — arquivo único, PWA, **1,84 MB**, sem bibliotecas externas. Acompanham `sw.js`, `manifest.json` e os ícones.

**Páginas** (seções `.pagina`, navegadas por `abrirPagina(<chave>)`; a chave é o id sem o prefixo `pg-`):

| Menu | id | chave |
|---|---|---|
| 01 Panorama | `pg-inicio` | `inicio` |
| 02 Índice de incidência + Raio-X | `pg-incidencia` | `incidencia` |
| 03 Cronograma | `pg-cronograma` | `cronograma` |
| 03.1 Manual operacional | `pg-operacional` | `operacional` |
| 04 Material de estudo | `pg-material` | `material` |
| 04.1 IN 39 interativa | `pg-in39` | `in39` |
| 04.2 Jurisprudência que cai | `pg-juris` | `juris` |
| 05 Banco de questões | `pg-questoes` | `questoes` |
| 06 Provas originais | `pg-provas` | `provas` |
| 07 Metodologia e fontes | `pg-metodo` | **`metodo`** |

**Dados (constantes no próprio arquivo):**

- `QUESTOES` — **508** questões. Formato:
  ```js
  {id:'DA92', mat:'Direito Administrativo', ass:'Lei 8.112/1990', ano:2015, anc:'adm-8112',
   jur:['SV-13'],            // opcional: ids de JURIS
   fund:'...', en:'...', alt:[5 strings], ok:0..4, exp:[5 strings]}
  ```
  `exp[ok]` começa com `"Correta."`; os demais, com `"Errada."`. Em `exp` só valem as tags `<b>`, `<i>` e `<u>`; `en` e `alt` não aceitam tags.
- `JURIS` — 185 enunciados (TST, STF, STJ), com `bloco` ligando cada um a uma semana do cronograma.
- `RAIOX` — 240 linhas, uma por questão das quatro provas reais.
- `CRONOGRAMA` — 13 semanas (31/08/2026 a 28/11/2026), 9 blocos por semana, ids como `s3-da`.
- `DISCIPLINAS`, `ANOS`, `ASSUNTOS`, `COTA_SIMULADO` — **não alterar** (regra do HANDOFF original).

**Maior id por prefixo** (o próximo lote continua a sequência):

```
DT 79 | PT_T 94 | PT 83 | RL 31 | DA 97 | PC 56 | CO 39 | LG 32 | AD 23
```

**Distribuição atual dos gabaritos** (A→E): `98 / 136 / 108 / 88 / 78`. Lotes novos devem puxar para **D, E e A**.

**Armazenamento local** (prefixo `trt4:`, camada única `LS`, com queda para memória):

| Chave | Conteúdo |
|---|---|
| `trt4:respostas` | marcações da rodada em curso (somem ao zerar respostas ou trocar filtro) |
| `trt4:historicoQuestoes` | **histórico permanente por questão**: `{id:{n, ac, h:[[data, letra, acertou], …10 últimas]}}` |
| `trt4:placarSemanal` | acertos e erros por semana e disciplina |
| `trt4:cronograma` | blocos marcados |
| `trt4:historicoSimulados` | simulados concluídos |

**56 âncoras de tópico** no material (`<details class="topico" id="...">`), usadas por `QUESTOES.anc`, `JURIS.anc` e pelos links `data-ir`.

---

## 3. O que foi entregue nesta sessão

### 3.1 Histórico por questão e modal (já no main, PR #2)

- Faixa no alto da ficha, só quando a questão já foi respondida: "Já respondida 3 vezes · 2 acertos e 1 erro · última: errou em 16/09".
  - Antes de responder, **não mostra a letra marcada**, para não entregar a resposta.
  - No gabarito, bloco "Suas respostas a esta questão", com as 10 últimas (data, letra, resultado) e "e mais N anteriores".
- **No simuladão**, a faixa só aparece depois da resposta. A regra usa `emSimulado()`, que devolve `estado.ordem !== null` — só o botão do simuladão preenche esse campo, então a regra sobrevive ao "Zerar respostas" no meio do sorteio.
- **"Zerar progresso"** abre um `<dialog class="modal">` (`#dlgZerar`) que explica o que será apagado, com as contagens do momento, e tem **Confirmar** e **Cancelar**. Esc e clique fora cancelam (o Esc é tratado por `keydown` no próprio dialog, porque o comportamento nativo falhou no navegador de teste).
- Funções novas: `registrarNoHistorico`, `faixaHistoricoHTML`, `listaHistoricoHTML`, `atualizarFaixaHistorico`, `emSimulado`, `dataDoHistorico`, `contarProgresso`, `zerarProgresso`, `preencherModalZerar`, `abrirModalZerar`. Reaproveitam `plural()`, `hojeISO()`, `esc()`, `LETRAS`, `$`/`$$`.
- CSS novo: `.hist-q`, `.hist-marca`, `.hist-lista`, `.ficha.tem-hist .carimbo{top:98px}` (com `top:auto` no celular), `.modal*`, `.btn.perigo`.
- Correção de borda: a tabela antiga da página 07 alargava a tela no celular. A regra `#pg-incidencia / #pg-material / #pg-metodo .tabela:not(.tabela-rolagem > .tabela)` faz as tabelas rolarem por dentro em até 640 px.

**Limitação registrada:** o app nunca guardou dados por questão. Na primeira abertura, só as marcações da rodada em curso viram histórico, com "data não registrada". Rodadas já zeradas não podem ser recuperadas.

### 3.2 Lei 8.112 — lacunas, material e questões (branch `claude/lei-8112-adicionais`)

Origem: as faixas de artigos do manual pulavam trechos inteiros da lei.

- **Faixas corrigidas** na 03.1:
  - semana 2: `arts. 5º a 20, 21 a 32, 33 a 35 e 36 a 39`;
  - semana 3: `arts. 40 a 52, 53 a 66, 67 a 76-A, 77 a 80, 81 a 92 e 93 a 115`.
- **Títulos dos blocos** `s2-da` e `s3-da` atualizados **nos seis lugares** em que cada um aparece: `CRONOGRAMA`, cartão da semana, lista do dia e as três revisões espaçadas da 03.1. Os **ids não mudaram**, então o progresso marcado continua valendo.
- **Material**, tópico `adm-8112`: bloco novo "Gratificação natalina e adicionais", entre "Direitos e vantagens" e "Deveres e proibições" — cards com arts. 63 a 66 e 68, 73, 74, 75 e 76; texto com arts. 69 a 72 e 76-A; pegadinha do noturno de 25% (Lei 8.112) contra 20% (CLT).
- **Seis questões**: `DA92` a `DA97` (gabaritos B, B, A, D, E, C), assunto "Lei 8.112/1990", âncora `adm-8112`.
- `sw.js`: cache **v6** (o main está em v5).

---

## 4. Pendências

1. **Abrir o PR** do branch `claude/lei-8112-adicionais` (link na seção 1).
2. **Material ainda sem texto próprio** para dois trechos da Lei 8.112 que já caíram no TRT4 e hoje só aparecem em questões:
   - arts. 36 a 39 — remoção, redistribuição e substituição (remoção caiu em 2006 e 2011);
   - arts. 93 a 115 — cessão e mandato eletivo (art. 93 caiu em 2011), concessões, tempo de serviço e direito de petição (arts. 104 a 115 caíram em 2006).
   Já ofereci escrever esses dois blocos; a pessoa usuária ainda não respondeu.
3. **12 súmulas do STJ** na página 04.2 estão marcadas `conf:false`: o portal do STJ exibe desafio anti-robô e **não deve ser contornado**. Conferência manual pendente.
4. **51 enunciados de prioridade 3** ficam fora do plano de estudo de propósito (consulta opcional na 04.2).
5. **Questão 25 da prova de 2006**: o gabarito oficial é D, mas a lei aponta A. Está marcada como "conferir" no Raio-X.
6. A programação de jurisprudência do manual começa em **21/09/2026 (semana 4)**; as semanas 1 a 3 ficaram como estavam.

---

## 5. Como testar

### Servidor local e navegador

O worktree **não versiona** `.claude/launch.json`; crie antes de testar e apague no fim:

```json
{ "version": "0.0.1", "configurations": [ { "name": "autos-do-estudo", "runtimeExecutable": "python", "runtimeArgs": ["-m", "http.server", "8765", "--bind", "127.0.0.1"], "port": 8765 } ] }
```

Depois, `preview_start` com o nome `autos-do-estudo` (porta 8765).

**Sempre limpe o service worker e os caches antes de recarregar**, senão a versão antiga continua sendo servida:

```js
const regs = await navigator.serviceWorker.getRegistrations(); for (const r of regs) await r.unregister();
for (const k of await caches.keys()) await caches.delete(k);
```

### Medição a 375 px (armadilha)

Na emulação de celular, o `innerWidth` **cresce** quando há estouro (chega a 479, 488…). Use **376 px como limite fixo**, nunca `innerWidth`, e ignore elementos com ancestral de `overflow-x` diferente de `visible`. O certo é `document.documentElement.scrollWidth === 375` em todas as páginas.

### Scripts (scratchpad da sessão, pode ter sido apagado)

`C:\Users\thale\AppData\Local\Temp\claude\C--Users-thale-Documents-GitHub-AppEstudos--claude-worktrees-questoes-historico-in39-139338\987bfdd2-305d-4b53-8bfb-e15c943f2553\scratchpad`

| Script | Para que serve |
|---|---|
| `checar.js` | checagem estrutural do `index.html` (sintaxe dos scripts, tags, ids, referências `$('#id')`, integridade de QUESTOES/JURIS/RAIOX, 300 sorteios de simulado). Termina com "Tudo certo." |
| `teste_file3.js` | abre o app como `file://` num Edge sem interface e testa páginas, IN 39, faixa de histórico e modal |
| `diff_manual.js` | compara o texto do manual original com o da página 03.1 |
| `fidelidade.js` | confere cada texto de JURIS contra a fonte oficial |
| `aplicar_historico.js`, `aplicar_8112.js` | aplicaram as mudanças desta sessão; servem de modelo de edição com verificação |
| ~~`build.js`~~ | **obsoleto. Não rodar.** Ele remonta tudo a partir do HEAD, que já contém as mudanças, e duplicaria as inserções. |

### Conferência de fim de linha (obrigatória)

```bash
node -e "const s=require('fs').readFileSync('index.html','latin1');const c=(s.match(/\r\n/g)||[]).length,l=(s.match(/\n/g)||[]).length;console.log('CRLF',c,'LF solto',l-c)"
```

`LF solto` tem de ser **0**. O `git diff --stat` também precisa mostrar poucas linhas — se mostrar o arquivo inteiro, o fim de linha quebrou.

---

## 6. Armadilhas do ambiente

- **CRLF:** `core.autocrlf=true`. O índice guarda LF; o arquivo no disco é CRLF. Script que edita o `index.html` deve ler, normalizar para `\n`, editar e gravar de volta com `\r\n`.
- **O worktree volta ao branch antigo** ao reabrir a sessão (`claude/questoes-historico-in39-139338`, commit antigo). Antes de editar: `git status`, `git fetch`, `git log --oneline -3 origin/main` e criar o branch a partir de `origin/main`.
- **Escrita bloqueada na pasta principal:** a sessão roda no worktree; o Write recusa caminhos do checkout base. Para levar um arquivo para lá, use `cp` pelo terminal.
- **Editar direto no `index.html`**, com script que confere se cada trecho antigo aparece o número esperado de vezes. Cuidado: título de bloco do cronograma aparece em **seis** lugares (dado, cartão, dia e três revisões).
- **`grep` com `cut -c1-N` engana**: linhas longas escondem ocorrências. Conte com `grep -o ... | wc -l`.
- **Cache do service worker:** toda entrega que muda o `index.html` precisa subir o número em `sw.js` (`autos-do-estudo-vN`), senão quem já instalou não recebe a atualização.
- **`file://`:** o `manifest.json` é bloqueado (origem `null`) — esperado e inofensivo. A IN 39 cai de `blob:` para `srcdoc` nesse modo.
- **Linha gigante:** a constante `IN39_HTML` tem centenas de milhares de caracteres numa linha só. Ler faixas que a incluam estoura a saída; evite.
- **Sem `gh` e sem Chrome conectado:** PRs só por link preenchido.

---

## 7. Convenções

- **Idioma:** tudo em português do Brasil, inclusive commits, PRs e comentários de código.
- **Fluxo:** ler, planejar, executar, **testar** e só então entregar. Sem parar no meio para pedir confirmação.
- **Sem commit nem PR** sem pedido explícito.
- **Interface:** ação destrutiva pede modal de confirmação, com consequências e botões Confirmar/Cancelar. No simuladão, nada que dê pista antes da resposta. O app é usado por um estudante com autismo: textos literais e previsíveis, sem animação desnecessária.
- **Questões novas:** conferir o fundamento na fonte antes de escrever; comentar as cinco alternativas; usar assunto e âncora já existentes para não criar filtro novo; equilibrar os gabaritos.
- **Direito autoral:** não reproduzir enunciados da FCC. Texto de lei, súmula e OJ pode (Lei 9.610, art. 8º, IV).

---

## 8. Fontes jurídicas

- **Leis:** cópias locais na pasta principal, **não versionadas** — `Lei8112.html`, `CPC.html`, `Licitacoes.html`, `CLT - 15.06.26.pdf`, além de `Provas/` (PDFs das quatro provas com gabaritos) e `cronograma-operacional-trt4.html` (original do manual).
- **TST:** Livro de Súmulas, OJs e PNs — `https://www.tst.jus.br/documents/d/guest/livrointernet-12-pdf` (≈3,2 MB, até a Res. 225/2025). A tabela de precedentes vinculantes baixa com `curl`.
- **STF:** `curl` recebe 403 e o WebFetch falha por certificado. Funciona com `fetch` de dentro do navegador, na origem do portal (súmulas vinculantes em `sumariosumulas.asp?base=26`; súmulas em `base=30`). As teses de repercussão geral ficaram como síntese (`literal:false`).
- **STJ:** portal com desafio anti-robô. **Não contornar.**

---

## 9. Contexto do concurso

- TRT da 4ª Região, Analista Judiciário, Área Judiciária. Banca provável: FCC. Edital ainda não publicado; o material segue o Edital 01/2022.
- Provas de referência: 2006, 2011 (arquivo "Prova 2012.pdf"), 2015 e 2022 (caderno Tipo 003).
- Cronograma de 13 semanas, de 31/08/2026 a 28/11/2026, com 21 horas semanais. Semana 3 = 14 a 19/09/2026.
- Linha de base do estudante: 27 acertos em 60 sem preparo. Meta realista: 52 a 55.

---

## 10. Memória já gravada

Em `C:\Users\thale\.claude\projects\C--Users-thale-Documents-GitHub-AppEstudos\memory\`:

- `fluxo-de-entrega.md` — ler, planejar, executar, testar, entregar, em português.
- `appestudos-crlf-e-fontes.md` — CRLF, fontes não versionadas, `blob:` em `file://`, worktree que volta ao branch antigo.
- `fontes-jurisprudencia-acesso.md` — como acessar TST, STF e STJ.
- `appestudos-preferencias-ui.md` — modal para ações destrutivas, simuladão sem pistas, textos literais.

---

## 11. Primeiro comando numa janela nova

```bash
cd "C:/Users/thale/Documents/GitHub/AppEstudos/.claude/worktrees/questoes-historico-in39-139338" && git fetch origin && git status --short --branch && git log --oneline -3 origin/main
```
