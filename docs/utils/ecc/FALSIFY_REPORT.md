# ECC Integration — Falsify-All Report

> Mode: falsify | artifact: doc + map
>
> Date: 2026-05-29 · Revised: 2026-05-29 (lint+falsify pass applied)
>
> Analyst: Claude Sonnet 4.6
>
> Scope verified: `utils/ECC/hooks/hooks.json` (lines 1–310, tail unconfirmed — see L-01), `schemas/hooks.schema.json`, `agents/architect.md`, `skills/tdd-workflow/SKILL.md`, `package.json` (`files[]` fully read), `LICENSE`, `VERSION`, `.claude/rules/node.md`, `.claude/rules/everything-claude-code-guardrails.md`, `docs/utils/ecc/*.md` (13 files)
>
> Status: **BRAINSTORM — não implementar sem aprovação humana**
>
> ⚠️ **Scope caveat (L-01):** `hooks.json` foi lido até linha ~310 em dois chunks. O claim anterior "full, 320 lines" era não comprovado. O array `Stop` pode ter entradas após `stop:cost-tracker`. Hook IDs adicionais podem existir.

---

## Índice

1. [Gaps Funcionais — Documentação vs. Realidade](#1-gaps-funcionais)
2. [Overkill e Drawbacks Reais](#2-overkill-e-drawbacks)
3. [Análise de Drift Risk](#3-drift-risk)
4. [Análise de Licença](#4-licença)
5. [Análise de Integrabilidade — Módulo por Módulo](#5-integrabilidade-por-modulo)
6. [ECC como Módulo vs. Integração Directa na Base](#6-ecc-como-modulo-vs-integracao-directa-na-base)
7. [Candidatos de Integração — Mínimo Drift, Máximo Complemento](#7-candidatos-de-integração)

---

## 1. Gaps Funcionais

### 🔴 F-01 — `HOOKS.md`: formato do `hooks.json` está estruturalmente errado

**O que a documentação diz:**
```jsonc
{ "id": "...", "event": "PreToolUse", "matcher": {...}, "command": "..." }
```

**O que o ficheiro real contém** (`hooks/hooks.json`, verificado):
```jsonc
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "node -e ..." }],
        "description": "...",
        "id": "pre:bash:dispatcher"
      }
    ]
  }
}
```

Diferenças críticas verificadas:
- Campo `event` **não existe** — é a chave do objecto pai (`"PreToolUse":`, `"Stop":`, etc.)
- `command` vive em `hooks[].command`, não no nível da entrada
- Campo obrigatório `type: "command"` ausente da documentação
- `matcher` é **string** (`"Bash"`, `"Edit|Write|MultiEdit"`, `"*"`), não objecto
- Existe evento `PostToolUseFailure` (linha 248 verificada) — ausente da documentação
- Hook `Stop` usa inline script com leitura de stdin (`fs.readFileSync(0,'utf8')`) e deve escrever o transcript no stdout — comportamento fundamentalmente diferente dos hooks `PreToolUse`

**Impacto:** Qualquer dev que escreva um hook baseado nesta documentação gerará JSON inválido que o Claude Code ignorará silenciosamente.

---

### 🔴 F-02 — `HOOKS.md`: IDs verificados vs. documentados

IDs reais verificados no `hooks.json` (leitura até linha ~310):

| ID Real | Evento Real | ID Documentado | Estado |
|---|---|---|---|
| `pre:bash:dispatcher` | PreToolUse | `pre:bash:dispatcher` | ✅ correcto |
| `pre:write:doc-file-warning` | PreToolUse | `pre:write:doc-file-warning` | ✅ correcto |
| `pre:edit-write:suggest-compact` | PreToolUse | — | omisso |
| `pre:observe:continuous-learning` | PreToolUse | — | omisso |
| `pre:governance-capture` | PreToolUse | listado como PostToolUse | evento errado |
| `pre:config-protection` | PreToolUse | `pre:config:protect` | nome errado |
| `pre:mcp-health-check` | PreToolUse | `pre:mcp:health-check` | separador errado |
| `pre:edit-write:gateguard-fact-force` | PreToolUse | `pre:edit-write:gateguard-fact-force` | ✅ correcto |
| `pre:compact` | PreCompact | `pre:compact` | ✅ (evento correcto) |
| `session:start` | SessionStart | `session:start` | ✅ correcto |
| `post:bash:dispatcher` | PostToolUse | — | omisso |
| `post:quality-gate` | PostToolUse | `post:quality-gate` | ✅ correcto |
| `post:edit:design-quality-check` | PostToolUse | — | omisso |
| `post:edit:accumulator` | PostToolUse | — | omisso |
| `post:edit:console-warn` | PostToolUse | — | omisso |
| `post:governance-capture` | PostToolUse | listado como PreToolUse | existe em AMBOS |
| `post:session-activity-tracker` | PostToolUse | — | omisso |
| `post:observe:continuous-learning` | PostToolUse | — | omisso |
| `post:ecc-metrics-bridge` | PostToolUse | — | omisso |
| `post:ecc-context-monitor` | PostToolUse | `post:ecc-context-monitor` | ✅ correcto |
| `post:mcp-health-check` | PostToolUseFailure | classificado como pre: | evento errado |
| `stop:format-typecheck` | Stop | `stop:format-typecheck` | ✅ correcto |
| `stop:check-console-log` | Stop | — | omisso |
| `stop:session-end` | Stop | — | omisso |
| `stop:evaluate-session` | Stop | — | omisso |
| `stop:cost-tracker` | Stop | — | omisso (pode haver mais após linha 310) |

Documentação cobre ~10 hooks; verificados 26+ com eventos e nomes divergentes.

---

### 🔴 F-03 — `SCHEMAS.md`: formato e `additionalProperties` documentados incorrectamente

O schema real (`schemas/hooks.schema.json`, verificado) é um `oneOf` com duas formas:

```
Forma 1: { "hooks": { "PreToolUse": [matcherEntry], ... } }   ← formato settings.json
Forma 2: [matcherEntry, ...]                                    ← formato array simples
```

O schema define 3 tipos de hook (`commandHookItem`, `httpHookItem`, `promptHookItem`) — a documentação só menciona `command`. Os hooks HTTP e `prompt`/`agent` são omitidos. O schema usa `additionalProperties: true` (linhas 47, 78, 104 verificadas) — a afirmação da documentação de `"additionalProperties": false` é **falsa**.

---

### 🔴 F-04 — `SKILLS.md` e `INDEX.md`: undercounting e distinção repo vs. publicado ausente

O `package.json` `files[]` lista **186 entradas `skills/*/`** explicitamente — estas são as skills **publicadas no npm**. O Glob do `SKILL.md` retornou skills adicionais não listadas em `files[]`: `agent-payment-x402`, `autonomous-agent-harness`, `benchmark`, `browser-qa`, `bun-runtime`, `canary-watch`, `cisco-ios-patterns`, `click-path-audit`, `codebase-onboarding`, `context-budget`, `design-system`, `django-celery`, `flox-environments`, `flutter-dart-code-review`, `frontend-a11y`, `gan-style-harness`, `gateguard`, `git-workflow` e mais.

Duas populações distintas: ~186 skills publicadas + N skills WIP/experimentais no repo. O "250" original e o "290+" desta análise misturavam as duas. A documentação deve referenciar o `package.json` `files[]` como fonte canónica de skills publicadas e advertir que o repo contém skills adicionais não publicadas.

`SKILLS.md` omite categorias com valor real para este template: `architecture-decision-records`, `git-workflow`, `codebase-onboarding`, `error-handling`, `context-budget`, `continuous-learning-v2`.

---

### 🟡 F-05 — `AGENTS.md` (ECC doc): `architect.md` contém stack hardcoded não neutral

O agente `architect.md` (verificado) contém "Project-Specific Architecture (Example)" com stack hardcoded (`Next.js 15`, `FastAPI`, `Redis Stack`, `Supabase`) e ADR de exemplo para vector search em Redis — o projecto de mercados de predição do autor. A documentação ECC não adverte que agentes contêm exemplos de stack específicos, o que pode confundir adopters de projectos com stacks diferentes.

---

### 🟡 F-06 — `SKILLS.md`: `tdd-workflow` contradiz anti-mock rule deste template

O `tdd-workflow/SKILL.md` (verificado) inclui mocks explícitos (`jest.mock('@/lib/supabase', ...)`, `jest.mock('@/lib/redis', ...)`). A regra deste template (`dont_do.md`): **"Do NOT mock the database in integration tests"**. Uso directo desta skill contradiz as regras do template.

---

### 🟡 F-07 — `SCRIPTS.md`: afirmação "zero external deps em hooks" é parcialmente falsa

Hook scripts individuais são thin (sem deps externas). Mas `scripts/lib/` — onde a lógica vive — usa `ajv@^8`, `@iarna/toml@^2.2.5`, `sql.js@^1.14.1` (runtime deps do `package.json`). A afirmação "sem `npm install` em runtime" é enganosa: requer `npm install` prévia do pacote ECC.

---

### 🟢 F-08 — `ECC2.md`: `notifications.rs` não documentado

`ecc2/src/notifications.rs` existe no source mas não tem entrada própria no `ECC2.md`. Omissão menor.

---

### 🟢 F-09 — `LLM_LAYER.md`: `src/llm/` não é distribuído via npm

`package.json` `files[]` não inclui `src/`. O módulo Python LLM existe apenas no clone git — não em instalações via `npx ecc-universal install`. A documentação não distingue disponibilidade git vs. npm.

---

## 2. Overkill e Drawbacks

### 🔴 D-01 — Inline Node.js de 800+ chars por hook: auditoria impossível

O resolver de `CLAUDE_PLUGIN_ROOT` está duplicado como JavaScript minificado e inline em **cada** entrada de hook — o mesmo bloco de 800+ chars repetido 26+ vezes. Consequências:

- **Auditoria impossível**: nenhum diff é legível; qualquer alteração gera diff de milhares de linhas.
- **Teste indirecto**: o resolver inline não é testado unitariamente — existe só como string.
- **Propagação de bugs**: um bug está replicado 26+ vezes; fix requer substituição em massa.
- **Context pollution**: quando o Claude Code lê `hooks.json`, consome tokens massivos com código repetido não semântico.

Existe por necessidade arquitectural (o Claude Code executa hooks como comandos de shell sem loader partilhado) mas é o drawback técnico mais severo do ECC.

---

### 🔴 D-02 — `utils/ECC/` como clone estático sem mecanismo de update

Não há `git submodule`, `git subtree`, lock de versão em CI, nem script de update. O upstream está em `2.0.0-rc.1` (alpha). Os hooks em `utils/ECC/hooks/hooks.json` **não estão activos** neste template — são ficheiros no filesystem sem ligação ao `.claude/settings.json`. O valor operacional actual é zero.

Risco de segurança: se o `pre:bash:dispatcher` tiver uma vulnerabilidade corrigida upstream, este template fica exposto indefinidamente sem saber.

---

### 🔴 D-03 — `hooks.json` do ECC incompatível com o sistema de hooks deste template

Se alguém tentar activar hooks ECC copiando para `.claude/settings.json`:

1. O resolver inline procura `scripts/lib/utils.js` em `~/.claude/plugins/ecc/` — inexistente aqui.
2. Hooks Bash existentes e `pre:bash:dispatcher` do ECC correm ambos — sem garantia de ordem ou idempotência.
3. `ECC_HOOK_PROFILE` (`minimal|standard|strict`) não está configurado, causando comportamento de gating indefinido.

---

### 🟡 D-04 — 186+ skills publicadas são cognitivamente intractáveis sem curadoria

Skills como `blender-motion-state-inspection`, `customs-trade-compliance`, `defi-amm-security`, `visa-doc-translate` são verticais de negócio irrelevantes para um template de engenharia genérico. Sem mapeamento entre perfis de instalação e casos de uso do template, um adopter não sabe por onde começar. Carregar `agent.yaml` no contexto aumenta token usage de arranque de forma não linear.

---

### 🟡 D-05 — Agentes com stack-specific content violam template neutrality

`architect.md` (verificado) contém arquitectura de referência para um projecto específico de mercados de predição. Um adopter com stack Go + PostgreSQL recebe guidance calibrada para Next.js + Supabase.

---

### 🟡 D-06 — `ecc2/` Rust não compilável sem toolchain — sem aviso em runtime

`ECC2.md` lista `cargo run -- dashboard` como comando sem advertir: Rust não está nos prerequisites do template, compilação de `ratatui` + `tokio` + `git2` (com bindings C para libgit2) demora 5–15 min na primeira vez, e o módulo é **ALPHA** sem backward compatibility.

---

### 🟡 D-07 — `ecc_dashboard.py` monolítico e sem testes verificados

~41k linhas não aparecem em nenhum teste do `tests/` do ECC (pytest cobre apenas `src/llm/`). Nunca foi executado neste template. Documentar `LLM_LAYER.md` como API estável importada pelo dashboard é especulativo.

---

### 🟢 D-08 — `commands/` legacy documentado com detalhe desproporcional

A documentação `COMMANDS.md` declara que skills são a forma moderna. Documentar 79 commands em detalhe perpetua o que o próprio ECC desencoraja.

---

## 3. Drift Risk

### 🔴 DR-01 — Nenhum mecanismo de detecção de versão ECC no CI

`template-drift.yml` não lê `utils/ECC/VERSION`. Em 6 meses, o upstream pode lançar `2.1.0` com breaking changes e o template continua em `2.0.0-rc.1` sem saber.

---

### 🔴 DR-02 — Os 13 ficheiros `docs/utils/ecc/` divergem no primeiro commit upstream

Contagens de skills, IDs de hooks, lista de agentes e MCP servers foram derivados de análise estática num momento específico. Qualquer commit upstream torna estes valores stale sem aviso. Cenários:

1. Upstream adiciona skills → contagem fica errada.
2. Upstream renomeia `post:quality-gate` → `post:lint-gate` → `HOOKS.md` documenta nome inexistente.
3. Upstream remove `architect.md` → `AGENTS.md` documenta agente inexistente.

---

### 🟡 DR-03 — Schema de hooks referencia URL externo da comunidade (não da Anthropic)

O `$schema` em `hooks/hooks.json` aponta para `https://json.schemastore.org/claude-code-settings.json`. SchemaStore é um projecto open source da comunidade — **não da Anthropic** (correcção de L-06 da auditoria lint). A atribuição anterior "da Anthropic/SchemaStore" estava errada. A URL pode mudar ou o schema evoluir sem notificação — sem lock do schema remoto, validação local pode quebrar silenciosamente.

---

### 🟡 DR-04 — `agent.yaml` — mecanismo de exportação não documentado

O `agent.yaml` é o manifesto central do ECC. A sua estrutura e consumidor (harness loader) não são documentados. Mudança de formato quebra todos os adapters sem sinal de aviso.

---

### 🟢 DR-05 — `engines.node >= 18` vs. Node 22 do template

Compatível agora. Risco baixo se o ECC elevar o requisito e usar APIs específicas de versão.

---

## 4. Licença

### 🟢 L-01 — MIT License — totalmente livre, sem obrigações de copyleft

**Verificado**: `utils/ECC/LICENSE`: `MIT License © 2026 Affaan Mustafa`.

Permissões: uso comercial, modificação, distribuição, sublicenciamento, uso privado.
Condição única: preservar copyright notice e licence text em cópias ou partes substanciais do **software** (código executável, scripts).
Compatibilidade com este template: **total**.

---

### 🟡 L-02 — Atribuição MIT: risco real apenas para conteúdo executável copiado

A análise anterior sobrestimava o risco. A doutrina de *substantial portions* no MIT aplica-se primariamente à redistribuição do **software** (código executável, scripts), não a documentação derivada que descreve a sua estrutura em prosa.

**Onde o risco É real:** se scripts de `scripts/hooks/` ou `scripts/lib/` forem copiados directamente para o template sem atribuição, a condição MIT aplica-se.

**Onde o risco é baixo:** os 13 ficheiros `docs/utils/ecc/` são prosa descritiva — IDs de hooks e nomes de skills são factos não protegíveis por copyright.

**Para candidatos de integração C-03..C-10 (código nativo inspirado no ECC):** sem obrigação de atribuição — são implementações originais. Apenas conteúdo textualmente copiado de Markdown do ECC (como rules) requer atribuição.

**Solução proporcional ao risco:** para ficheiros de rules copiados de `rules/typescript/` e `rules/python/`, adicionar um comentário de cabeçalho:
```markdown
<!-- Adapted from ECC (Everything Claude Code) © 2026 Affaan Mustafa — MIT License
     https://github.com/affaan-m/ECC -->
```

---

### 🟢 L-03 — Dependências runtime: todas MIT ou ISC

| Pacote | Versão | Licença |
|---|---|---|
| `ajv` | ^8.18.0 | MIT |
| `@iarna/toml` | ^2.2.5 | ISC (compatível MIT) |
| `sql.js` | ^1.14.1 | MIT (SQLite é domínio público) |

Sem conflitos de licença.

---

### 🟢 L-04 — Skills, agents, rules: Markdown puro, MIT directamente aplicável

Sem dependências de terceiros incorporadas.

---

### 🟡 L-05 — `ecc_dashboard.py`: deps Python não auditadas

`pyproject.toml` não lista deps explicitamente. Sem `pip freeze` ou `poetry.lock`, não é possível verificar se há GPL/LGPL. Risco contingente — só activa se o dashboard for executado e as deps instaladas.

---

## 5. Integrabilidade por Modulo

### 5.1 Hooks (`hooks/hooks.json`)

**Integrabilidade geral: MÉDIA — selectiva, com reescrita obrigatória**

A integração directa é bloqueada pelo resolver inline de 800+ chars (D-01) e pela incompatibilidade de paths (D-03). A lógica dos hooks tem alto valor mas requer reimplementação nativa.

**Nota crítica sobre o evento `Stop`:** hooks `Stop` do Claude Code lêem o transcript completo via stdin e devem escrever o transcript (possivelmente modificado) via stdout. Um hook Stop que escreva apenas output de lint **corromperia o transcript da sessão**. Qualquer implementação nativa de hook Stop deve: `raw = readFileSync(0, 'utf8')` → processar → `process.stdout.write(raw)`. Este comportamento é obrigatório e não é opcional.

| Hook ID | Valor para template | Obstáculo | Solução |
|---|---|---|---|
| `pre:config-protection` | Alto — impede enfraquecer lint configs | Depende de `scripts/lib/utils.js` ECC | Reescrever nativo (~20 linhas) |
| `pre:edit-write:gateguard-fact-force` | Alto — alinha com Directive 1 | Mesmo obstáculo | Reescrever nativo |
| `session:start` | Alto — bootstrap de sessão | Chama `session-start-bootstrap.js` ECC | Adaptar para `.agent/context/` |
| `post:quality-gate` | Alto — lint/typecheck depois de edits | Depende de toolchain ECC | Adaptar para `npm run lint && typecheck` |
| `stop:format-typecheck` | Alto — batch format no Stop | Depende de Biome/Prettier ECC; requer stdin/stdout correcto | Adaptar com stdin/stdout obrigatório |
| `stop:cost-tracker` | Médio — tracking de custos | Escreve para `~/.ecc/`; requer stdin/stdout | Adaptar path + stdin/stdout |
| `post:ecc-context-monitor` | Médio — aviso context exhaustion | Threshold não documentado; métricas internas ECC | Adaptar com threshold explícito |
| `post:observe:continuous-learning` | Médio — captura padrões | Depende de `observe-runner.js` | Adaptar para `.agent/MEMORY.md` |
| `pre:bash:dispatcher` | Baixo (complexidade alta) | 800+ chars inline, múltiplas deps | Não copiar — reescrever do zero se necessário |

**Conclusão:** não copiar o `hooks.json` — reimplementar scripts nativos simples sem resolver inline.

---

### 5.2 Rules (`rules/`)

**Integrabilidade: ALTA — cópia directa com curadoria**

Markdown puro, zero dependências. Directamente utilizáveis em `.claude/rules/` do template.

| Rule Set | Relevância | Acção |
|---|---|---|
| `rules/typescript/` | Alta — tooling do template é TS | Copiar + remover "Prompt Defense Baseline" |
| `rules/python/` | Alta — risk_engine, wizard em Python | Copiar + remover "Prompt Defense Baseline" |
| `rules/common/` | Alta — universais | Copiar + merge com `CLAUDE.md` |
| `rules/rust/`, `rules/golang/`, `rules/react/` | Média | Opcional por projecto filho |
| `rules/angular/`, `rules/arkts/`, `rules/dart/`, `rules/zh/` | Baixa | Excluir |

**Obstáculo:** todos os rule sets incluem "Prompt Defense Baseline" embutida — redundante e potencialmente conflituante com as directivas do `CLAUDE.md` deste template. Remover antes de integrar.

---

### 5.3 Skills (`skills/`)

**Integrabilidade: ALTA directamente — claim anterior sobre `CLAUDE_PLUGIN_ROOT` não verificada**

⚠️ **Correcção de FA-01:** A afirmação anterior de que skills "pressupõem `CLAUDE_PLUGIN_ROOT`" não foi verificada. O `tdd-workflow/SKILL.md` lido é Markdown puro sem referência a `CLAUDE_PLUGIN_ROOT`. Skills são resolvidas pelo Claude Code a partir de `.claude/skills/` (por projecto) ou `~/.claude/skills/` (globais) — **não via `CLAUDE_PLUGIN_ROOT`**. `CLAUDE_PLUGIN_ROOT` é o mecanismo de instalação do ECC como plugin, não o mecanismo de resolução de skills individuais.

**Consequência:** skills copiadas para `.agent/skills/` (ou `.claude/skills/`) deste template seriam resolvidas nativamente pelo Claude Code sem nenhum requisito de instalação do ECC. A classificação correcta é **ALTA directamente**, não "BAIXA como módulo".

Como referência para criar ou copiar skills nativas em `.agent/skills/`:

| Skill ECC | Integrabilidade directa | Observação |
|---|---|---|
| `tdd-workflow` | Alta (com adaptação) | Remover mocks Supabase/Redis — violam anti-mock rule |
| `architecture-decision-records` | Alta | Complementa `DECISION_LOG.md`; sem equivalente no template |
| `codebase-onboarding` | Alta | Ausente no template |
| `git-workflow` | Alta | Template tem `BRANCHES.md` mas não skill de workflow |
| `error-handling` | Alta | Ausente; alinha com `AppErrors.ts` do TUI Web |
| `security-review` | Alta | Template tem `SECURITY.md` mas não skill de review activa |
| `code-review` | Alta | Enriquece `/code-review` existente |
| `context-budget` | Média | Overlaps com `CLAUDE_TOKEN_OPTIMIZATION.md` |
| `continuous-learning-v2` | Média | Overlaps com mecanismo de memória |
| `deep-research` | Média | Útil para RFCs e ADRs |
| `database-migrations` | Média | Relevante se projecto filho tiver DB |
| `e2e-testing` | Média | Template tem `E2E_TESTING.md` mas não skill activa |
| `api-design` | Média | Template tem `API_CONTRACT.md` |

---

### 5.4 Agents (`agents/`)

**Integrabilidade: ALTA como referência; verificar mecanismo de resolução antes de copiar directamente**

O mecanismo de resolução de agentes é análogo ao de skills — provavelmente `.claude/agents/` ou `.agent/agents/`. A dependência de `CLAUDE_PLUGIN_ROOT` aplica-se à instalação do ECC como plugin, não à resolução de agentes individuais copiados. Requer verificação antes de afirmar integrabilidade directa.

O **formato** dos agentes ECC (YAML frontmatter com `name`, `description`, `tools`, `model` + Markdown estruturado com `## Role`, `## Capabilities`, `## When to Use`) é um template de qualidade para criar agentes nativos.

| Agente ECC | Relevância | O que falta no template |
|---|---|---|
| `architect` | Alta | Sem agente de arquitectura especializado |
| `code-reviewer` | Alta | `/code-review` skill existe mas não agente declarativo |
| `security-reviewer` | Alta | `SECURITY.md` existe mas não agente de review |
| `tdd-guide` | Média | Skill de TDD existe mas não agente |
| `planner` | Média | Útil para sprints |
| `build-error-resolver` | Média | Útil para CI failures |

`architect.md` tem conteúdo de qualidade (checklists, anti-patterns, ADR format, trade-off analysis) mas requer neutralização: remover stack hardcoded (Next.js, Redis, Supabase) e substituir por `node-ts`.

---

### 5.5 MCP Configs (`mcp-configs/`, `.mcp.json`)

**Integrabilidade: ALTA — conteúdo directamente transferível**

Criar `.mcp.json` neste template não activa servidores ECC — activa servidores MCP do ecossistema Anthropic/comunidade. O formato é idêntico. Não há `.mcp.json` activo neste template.

| Servidor MCP | Relevância | Obstáculo |
|---|---|---|
| `sequential-thinking` | Alta — raciocínio encadeado | Nenhum (local, sem custo) |
| `github` | Alta — PR/issue ops | Requer `GITHUB_TOKEN` |
| `context7` | Alta — docs de libs em tempo real | Requer conta Upstash (gratuita disponível) |
| `memory` | Média — overlaps com `.agent/memory.json` | Potencial duplicação |
| `exa` | Média — pesquisa web | Requer API key paga |
| `playwright` | Média — E2E automation | Requer Playwright instalado |

---

### 5.6 Schemas (`schemas/`)

**Integrabilidade: BAIXA directamente, MÉDIA como referência de design**

Schemas específicos dos artefactos ECC. O `hooks.schema.json` é transferível se o template vier a ter sistema de hooks com ficheiro de configuração próprio. O padrão de design (Draft-07, `additionalProperties: true` para forward compatibility em hook entries) é uma boa referência.

---

### 5.7 Scripts (`scripts/lib/`)

**Integrabilidade: BAIXA directamente — alta acoplagem ao ecossistema ECC**

60 módulos assumem `CLAUDE_PLUGIN_ROOT`, paths e manifests ECC. Excepções com valor transferível (sem deps ECC):

- `cost-estimate.js` — estimativa de custo de tokens.
- `detect-stack.js` — comparar com `scripts/detect-stack.js` do template (ver C-11).
- `package-manager.js` — detecção de package manager por lockfiles.

---

### 5.8 ECC 2.0 Rust (`ecc2/`)

**Integrabilidade: ZERO no curto prazo**

Requer Rust toolchain, compilação de 5–15 min, `libgit2` bindings nativos. Alpha quality. Sem valor imediato para template Node.js.

---

### 5.9 Python LLM Layer (`src/llm/`)

**Integrabilidade: MÉDIA como referência de design**

Não distribuído via npm (ausente do `files[]`). Existe apenas no clone git. O padrão `ILLMProvider` / `resolver` / `ToolRegistry` é referência de qualidade para scripts Python do template que precisem de suporte multi-provider.

---

### 5.10 Harness Adapters

**Integrabilidade: ZERO — específico do sistema de plugins ECC**

Excepção: `.claude/rules/` do ECC é um exemplo de como estruturar rules de linguagem neste template.

---

## 6. ECC como Modulo vs. Integracao Directa na Base

### Opção A — ECC como `utils/ECC/` (estado actual)

**Vantagens:**
- Zero modificação — integração passiva, só leitura.
- Update possível via `cd utils/ECC && git pull` (requer acção manual explícita — não automático via `git pull` na raiz do template).
- Isolamento: bugs do ECC não afectam o template core.
- Referência: devs podem navegar o source ECC directamente.
- MIT sem condições complexas.

**Desvantagens:**
- 2.000+ ficheiros no repositório sem execução.
- Nenhum hook, skill, ou agent é operacional — valor operacional zero.
- Drift inevitável sem detecção.
- Os 13 ficheiros `docs/utils/ecc/` já divergem do source (F-02, F-03, F-04).

**Veredicto:** documentação passiva de ferramenta externa. Valor educativo, zero valor operacional.

---

### Opção B — Integração selectiva de assets na base do template

Conteúdo específico do ECC integrado nas estruturas nativas:
- Rules → `.claude/rules/`
- Hooks lógica → `.claude/settings.json` (reimplementados nativamente)
- Skills → `.agent/skills/` (copiadas ou adaptadas)
- `.mcp.json` → raiz do template

**Vantagens:**
- Assets operacionais imediatamente.
- Sem dependência de `CLAUDE_PLUGIN_ROOT`.
- Versionados e testáveis como parte do template.
- Drift controlado: apenas o conteúdo seleccionado importa.
- Alinhamento com "Simplicity First".

**Desvantagens:**
- Updates do ECC não chegam automaticamente.
- Atribuição MIT necessária para conteúdo textualmente derivado (rules).
- Trabalho de adaptação (neutralização de stack-specific content).

**Veredicto:** maior ROI para assets de alta integrabilidade. Candidatos na secção 7.

---

### Opção C — `git submodule` apontando para upstream ECC

**Vantagens:**
- Versão lockada no `.gitmodules`.
- Update controlado via `git submodule update --remote`.

**Desvantagens:**
- `git submodule` é notoriamente difícil de usar correctamente.
- CI requer `git submodule update --init --recursive`.
- Upstream alpha com potencial de rebase/force-push quebra o pointer.
- `git subtree` seria mais resiliente para upstream alpha — não é mencionado aqui como alternativa mas é o caminho preferível se esta opção for escolhida.
- O conteúdo do submodule continua não sendo operacional sem adaptação (Opção B).

**Veredicto:** melhor que o estado actual para controlo de drift, mas não resolve operacionalização. Combinar com Opção B.

---

### Opção D — Remover `utils/ECC/`

**Vantagens:** elimina 2.000+ ficheiros de overhead e todo o risco de drift.

**Desvantagens:** perde referência e documentação criada. Decisão prematura antes de determinar quais assets têm valor.

**Veredicto:** avaliar após execução dos candidatos de integração.

---

## 7. Candidatos de Integração

> **Status: BRAINSTORM — nenhum item deve ser implementado sem aprovação humana explícita.**
>
> Critérios de selecção: (1) complementa o template sem duplicar, (2) drift mínimo pós-integração,
> (3) drawbacks conhecidos e mitigáveis, (4) MIT cumprido, (5) não requer `CLAUDE_PLUGIN_ROOT`.

---

### C-01 — `.mcp.json` — Activar MCP servers nativamente

**Tipo:** Ficheiro novo na raiz
**Drift pós-integração:** Muito baixo — ficheiro estático, sem dependência de versão ECC.
**Gap que preenche:** Não há `.mcp.json` activo no template. Claude Code fica sem acesso a docs de libs em tempo real, raciocínio encadeado, ou operações GitHub nativas.
**Acção:** Criar `.mcp.json` com subset: `sequential-thinking` (sem custo), `github` (requer `GITHUB_TOKEN`), `context7` (Upstash gratuito). Documentar env vars em `.env.example`.
**Atribuição MIT:** Não necessária — formato de configuração não é "substantial portion".
**Esforço estimado:** 1h.

---

### C-02 — `.claude/rules/typescript.md` e `.claude/rules/python.md`

**Tipo:** Ficheiros novos em `.claude/rules/`
**Drift pós-integração:** Muito baixo — conteúdo estático.
**Gap que preenche:** `.claude/` existe mas sem rules de linguagem. `CLAUDE.md` tem regras de alto nível; faltam standards detalhados de TypeScript (strict mode, `no any`, import order) e Python (type hints, protocols) — os dois stacks do tooling do template.
**Acção:** Copiar de `utils/ECC/rules/typescript/` e `rules/python/`. Remover "Prompt Defense Baseline" de cada ficheiro. Adicionar cabeçalho de atribuição MIT.
**Esforço estimado:** 2h.

---

### C-03 — Hook `pre:config-protection` nativo

**Tipo:** Script nativo novo (`tooling/hooks/config-protection.js` + entrada em `.claude/settings.json`)
**Drift pós-integração:** Zero — sem dependência upstream.
**Gap que preenche:** Nenhum hook activo no template. Agentes podem enfraquecer `eslint.config.js`, `.markdownlint.jsonc`, `.prettierrc` para "fazer testes passar" — Rule 4 (pre-commit gate) existe mas sem enforcement automático.
**Implementação:** Script de ~20 linhas que verifica se `tool_input.file_path` pertence à lista de config protegidas. Exit 0 com aviso no stderr se sim. Sem `CLAUDE_PLUGIN_ROOT`, sem resolver inline.
**Esforço estimado:** 3h (script + teste unitário + entrada settings.json).

---

### C-04 — Hook `stop:verify` nativo

**Tipo:** Script nativo novo (`tooling/hooks/stop-verify.js` + entrada em `.claude/settings.json`)
**Drift pós-integração:** Zero.
**Gap que preenche:** Pre-commit gate é manual. Um hook Stop que corra `npm run lint && npm run typecheck` no `tooling/` fecha automaticamente a gap entre "código escrito" e "código verificado" em cada resposta.

**Requisito de implementação crítico (FA-06):** Hooks `Stop` do Claude Code operam sobre o transcript JSON via stdin/stdout. A implementação **obrigatória**:

```js
const raw = fs.readFileSync(0, 'utf8');        // ler transcript do stdin
// ... correr lint/typecheck ...
process.stdout.write(raw);                      // escrever transcript de volta
```

Escrever apenas o resultado de lint no stdout (sem devolver o transcript) **corromperia a sessão**. Esta é uma diferença fundamental em relação a hooks `PreToolUse`.

**Esforço estimado:** 4h (script com stdin/stdout correcto + teste + entrada settings.json).

---

### C-05 — Skill `architecture-decision-records` nativa em `.agent/skills/`

**Tipo:** Nova skill nativa (copiar/adaptar de `utils/ECC/skills/architecture-decision-records/SKILL.md`)
**Drift pós-integração:** Zero — skill nativa no template.
**Gap que preenche:** `DECISION_LOG.md` existe como contexto passivo. Não há skill que guie o agente pelo processo de registar uma decisão arquitectural de forma estruturada.
**Acção:** Copiar skill. Remover referências a stacks específicos. Apontar para `DECISION_LOG.md` do template. Adicionar passos para commit atómico com mensagem `docs(adr): ...`.
**Atribuição MIT:** Adicionar cabeçalho se o texto for copiado directamente.
**Esforço estimado:** 2h.

---

### C-06 — Skill `error-handling` nativa em `.agent/skills/`

**Tipo:** Nova skill nativa
**Drift pós-integração:** Zero.
**Gap que preenche:** `BEST_PRACTICES.md` menciona error handling. Não há skill que guie o agente em hierarquias de erro (`AppError`), logging sem expor internals, propagação de audit failures.
**Adaptação:** Tornar neutral (`typescript`, `node-ts`). Adicionar exemplo TypeScript alinhado com `AppErrors.ts`.
**Esforço estimado:** 2h.

---

### C-07 — Hook `pre:gateguard` nativo (aviso de leitura prévia)

**Tipo:** Script nativo novo
**Drift pós-integração:** Zero.
**Gap que preenche:** Directive 1 (Think Before Coding) é instrução de `CLAUDE.md` sem enforcement automático.

**Implementação realista (correcção de L-04):** O evento `PreToolUse` recebe `tool_name` e `tool_input` — não tem acesso ao transcript histórico. Para rastrear "ficheiros lidos", o hook precisa de um state file entre chamadas. Fluxo:

1. Hook `PostToolUse` para `Read`/`Grep`/`Glob` — registar ficheiros lidos em `.claude/.read-files.json`.
2. Hook `PreToolUse` para `Edit`/`Write` — verificar se `tool_input.file_path` está no `.read-files.json`. Se não, emitir aviso (exit 0).
3. Hook `Stop` — limpar `.read-files.json`.

Complexidade real: 3 hooks coordenados + state file. Não é "script simples de 20 linhas".
**Esforço estimado:** 6h (3 scripts + estado + testes + entradas settings.json).

---

### C-08 — Hook `post:context-monitor` nativo

**Tipo:** Script nativo novo
**Drift pós-integração:** Zero.
**Gap que preenche:** `CLAUDE_TOKEN_OPTIMIZATION.md` é guia passivo. Não há sinal automático de context exhaustion.

**Threshold justificado (correcção de L-05):** `claude-sonnet-4-6` tem 200k context. Com 40+ ficheiros de contexto deste template (~15–20k tokens de context fixo), um threshold de **160k** (`input_tokens`) deixa ~40k de buffer útil — mais realista que 150k.

O evento `PostToolUse` inclui `usage.input_tokens` no payload JSON — leitura directa do stdin do hook.
**Esforço estimado:** 3h.

---

### C-09 — Hook `session:start` nativo com sumário do template

**Tipo:** Script nativo novo
**Drift pós-integração:** Zero.
**Gap que preenche:** Não há hook SessionStart. Cada sessão começa sem orientação — o agente tem de re-derivar o contexto.

**Implementação:** Script que lê `BACKLOG.md` (sprint activo), último entry de `DECISION_LOG.md`, e `VERSION` do template, e imprime um sumário estruturado no stderr (visível para o agente mas não no transcript).

**Race condition em sessões paralelas (FA-07):** se múltiplas sessões Claude Code estiverem activas simultaneamente, o hook pode ler `BACKLOG.md` a meio de uma edição de outra sessão. Mitigação: abrir ficheiros com `O_RDONLY` e aceitar dados potencialmente stale (read-only, sem impacto de integridade — apenas informativo).
**Esforço estimado:** 3h.

---

### C-10 — Agente `code-reviewer` declarativo em `.agent/agents/`

**Tipo:** Novo agente nativo (adaptar de `utils/ECC/agents/code-reviewer.md`)
**Drift pós-integração:** Zero.
**Gap que preenche:** `/code-review` skill existe mas é invocada manualmente. Um agente declarativo (com `tools`, `model: opus`, processo estruturado) é delegável automaticamente por outros agentes.
**Adaptação:** Remover referências ao projecto de mercados. Adicionar checklist de anti-patterns do `dont_do.md` deste template.
**Esforço estimado:** 2h.

---

### C-11 — Comparação e merge de `detect-stack.js`

**Tipo:** Investigação + possível update de `scripts/detect-stack.js` do template
**Drift pós-integração:** Zero — código nativo.
**Gap que preenche:** `detect-stack.js` do template pode não cobrir todos os casos que o ECC cobre (`.tool-versions`, `Cargo.toml`, `go.mod`, `pyproject.toml`). A comparação pode revelar gaps no CI matrix do template.
**Acção:** Ler ambos os ficheiros, fazer diff de cobertura, propor adições ao script nativo do template.
**Esforço estimado:** 2h.

---

### Tabela Resumo dos Candidatos

| ID | Asset | Tipo | Esforço | Drift | Valor | Dep. ECC | Nota |
|---|---|---|---|---|---|---|---|
| C-01 | `.mcp.json` | Ficheiro novo | 1h | Muito baixo | Alto | Zero | — |
| C-02 | Rules TS + Python | Ficheiros novos | 2h | Muito baixo | Alto | Zero | Remover Prompt Defense |
| C-03 | Hook config-protection | Script nativo | 3h | Zero | Alto | Zero | — |
| C-04 | Hook stop-verify | Script nativo | 4h | Zero | Alto | Zero | stdin/stdout obrigatório |
| C-05 | Skill ADR | Skill nativa | 2h | Zero | Alto | Zero | — |
| C-06 | Skill error-handling | Skill nativa | 2h | Zero | Médio | Zero | — |
| C-07 | Hook gateguard | 3 scripts + state | 6h | Zero | Médio | Zero | Mais complexo que estimativa anterior |
| C-08 | Hook context-monitor | Script nativo | 3h | Zero | Médio | Zero | Threshold: 160k |
| C-09 | Hook session-start | Script nativo | 3h | Zero | Médio | Zero | Race condition mitigável |
| C-10 | Agente code-reviewer | Agente nativo | 2h | Zero | Médio | Zero | — |
| C-11 | detect-stack.js merge | Investigação | 2h | Zero | Médio | Zero | Novo candidato |

**Esforço total (todos):** ~30h
**Esforço mínimo viável (C-01 + C-02 + C-03 + C-04 + C-05):** ~12h

---

### Nota sobre Template Neutrality e MIT

Candidatos C-03..C-11 são implementações **nativas** — o ECC é referência, não dependência. Isto:

1. Elimina drift upstream.
2. Garante compatibilidade com regras e directivas do template.
3. Preserva template neutrality (`start-project`, `node-ts`).
4. Remove obrigação de atribuição MIT para código nativo.
5. Permite testes unitários no `tooling/` sem ecossistema ECC.

Para C-02 (rules copiadas textualmente) e C-05 (skill copiada): adicionar cabeçalho de atribuição MIT nos ficheiros copiados.

---

*Fim do relatório. Estado: brainstorm — sem implementação até aprovação humana.*
*Revisão aplicada: 20 findings de auditoria lint+falsify — L-01..L-08, FA-01..FA-10.*
