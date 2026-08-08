# Arquitetura pós-básico (Fase 2)

## Contexto

O ciclo básico descrito em [Roadmap pos-mvp.md](./Roadmap%20pos-mvp.md) está completo: `/gasto`, `/receita`, `/saldo`, `/extrato`, `/remover`, `/resumo`, `/categorias` e `/categoria renomear|remover` já estão implementados e seguem a separação `commands/` → `services/` → `db/` definida em [Arquitetura mvp.md](./Arquitetura%20mvp.md).

Este documento planeja a próxima fase: fechar o ciclo de **planejamento** financeiro (orçamento, recorrência, edição) e a infraestrutura necessária para suportar isso (jobs agendados, migrations incrementais).

## Regra de privacidade (continua valendo)

Todo comando novo desta fase segue as mesmas regras já em vigor: respostas com valores são `ephemeral: true`, toda query filtra por `usuario_id` + `guild_id`, e qualquer alteração/remoção valida que o recurso pertence a quem chamou.

## Novas funcionalidades

### 1. Orçamento por categoria — `/orcamento`

- `/orcamento definir <categoria> <tipo> <valor>` — define limite mensal recorrente por categoria
- `/orcamento listar` — mostra limites definidos e o gasto atual do mês em cada um
- `/orcamento remover <categoria> <tipo>`
- Aviso automático: ao registrar um `/gasto`, se o total do mês na categoria ultrapassar o limite, adicionar um aviso na própria resposta ephemeral do `/gasto` (checagem síncrona, sem precisar de job).

### 2. Transações recorrentes — `/recorrente`

- `/recorrente adicionar <categoria> <tipo> <valor> <dia_mes> [descricao]` — ex.: aluguel todo dia 5
- `/recorrente listar` / `/recorrente remover <id>`
- Necessita um **job diário agendado** que lança automaticamente as transações do dia (novo componente de infra, ver abaixo).

### 3. Edição de transação — `/transacao editar` (ou `/editar`)

- Hoje só existe `/remover`; falta corrigir valor/categoria/descrição/data de um lançamento sem precisar apagar e recriar.
- Mesma checagem de propriedade que `/remover` já faz.

### 4. Exportação de dados — `/exportar`

- Gera CSV das transações do usuário num período e envia como anexo na resposta ephemeral.

### 5. Backlog (avaliar depois, não entra nesta fase)

- `/meta` — meta de saldo/economia mensal.
- Resumo mensal automático via DM no fechamento do mês (exige tabela de opt-in por usuário).

## Mudanças de arquitetura necessárias

### Migrations versionadas (pré-requisito técnico)

Hoje `schema.sql` só usa `CREATE TABLE IF NOT EXISTS`, o que não cobre `ALTER TABLE` em bancos já em produção. Propor:

- `src/db/migrations/NNN_descricao.sql`, aplicadas em ordem por `migrate.js`
- tabela de controle `schema_migrations (id, nome, applied_at)`

Necessário porque as tabelas novas (`orcamento`, `transacao_recorrente`) vão precisar entrar em bancos que já têm dados, sem perda.

### Camada de eventos — `src/events/`

Estava prevista desde o doc de arquitetura do MVP mas nunca foi extraída; hoje o listener `interactionCreate` fica direto no `index.js`. Com a entrada do scheduler (que depende do evento `ClientReady`), faz sentido extrair:

- `src/events/ready.js` — inicializa o scheduler
- `src/events/interactionCreate.js` — o handler atual

Carregados dinamicamente como os comandos, mesmo padrão de "adicionar arquivo não exige tocar em código existente".

### Scheduler / jobs — `src/jobs/`

- Nova dependência: `node-cron`
- `src/jobs/lancarRecorrentes.js` — roda 1x/dia, lança transações de `transacao_recorrente` cujo `dia_mes` bate com hoje (ajustando para o último dia do mês quando necessário)
- Job não posta em canal público — só grava no banco; usuário confere via `/extrato`, mantendo a regra de privacidade.

### Novos serviços

- `src/services/orcamentoService.js`
- `src/services/recorrenciaService.js`

Reaproveitam `getOrCreateUsuario`, `getOrCreateCategoria` e `registrarTransacao` já existentes.

## Modelo de dados proposto

**`orcamento`**
- `id` PK
- `usuario_id` FK → usuario
- `categoria_id` FK → categoria
- `valor_limite`
- `created_at`
- `UNIQUE (usuario_id, categoria_id)` — um limite por categoria, recorrente todo mês (sem `mes_referencia`, mantém simples)

**`transacao_recorrente`**
- `id` PK
- `usuario_id` FK → usuario
- `categoria_id` FK → categoria
- `tipo` — `gasto` ou `receita`
- `valor`
- `descricao`
- `dia_mes` — 1 a 31
- `ativo` — boolean, permite pausar sem apagar histórico
- `created_at`

**`schema_migrations`**
- `id`, `nome`, `applied_at`

## Ordem sugerida de implementação

1. Migrations versionadas (destrava tudo abaixo com segurança em produção)
2. `/orcamento definir|listar|remover` + aviso síncrono no `/gasto`
3. Extrair `src/events/` (pré-requisito para o scheduler)
4. `/recorrente` + job diário de lançamento
5. `/transacao editar`
6. `/exportar` (CSV)
7. Backlog: `/meta`, resumo mensal automático via DM

## Fora do escopo desta fase

- **Divisão de despesas entre usuários (split de contas)** — mudaria o modelo de dados (transação deixaria de pertencer a um único usuário) e a regra de privacidade atual. Avaliar como iniciativa separada se o grupo pedir.
- Multi-moeda, gráficos/embeds ricos, painel web.
