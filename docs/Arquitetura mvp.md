# Bot financeiro com discord js

## Visão Geral

Bot de Discord para automatizar o registro de gastos e receitas em um banco de dados local (SQLite), seguindo a lógica do controle financeiro pessoal (modelo 50/30/20) já existente.

## Stack

* **Runtime:** Node.js
* **Discord:** discord.js (slash commands)
* **Persistência:** SQLite (arquivo local, sem dependência de credenciais externas), acesso via `better-sqlite3` ou ORM (Prisma/Drizzle)
* **Deploy:** Docker, rodando no servidor pessoal (Nginx reverse proxy se necessário para endpoints futuros)

## Estrutura de Pastas

```
gastos-bot/
├── src/
│   ├── commands/          # um módulo por slash command
│   ├── services/          # camada de acesso ao banco e regras de negócio
│   ├── db/                 # schema, migrations e conexão com o SQLite
│   ├── events/            # listeners do client Discord (interactionCreate, ready, etc.)
│   ├── config/            # variáveis de ambiente, constantes
│   ├── deploy-commands.js # script para registrar slash commands na API do Discord
│   └── index.js           # entrypoint
├── .env.example
├── .gitignore           # inclui .env e o arquivo .db (dados locais não versionados)
├── Dockerfile
└── package.json

```

## Princípios Arquiteturais

1. **Separação entre comandos e acesso a dados** Comandos (`commands/`) não falam diretamente com o banco. Toda leitura/escrita passa por uma camada de serviço (`services/`), isolando a lógica de persistência. Isso mantém a porta aberta para trocar SQLite por Postgres no futuro (caso o projeto cresça para multi-tenant/multi-servidor) sem reescrever os comandos.
2. **Command handler dinâmico** Cada comando é um módulo independente com definição (`SlashCommandBuilder`) e execução (`execute`), carregado automaticamente. Adicionar um comando novo não exige tocar em código existente.
3. **Configuração via ambiente** Credenciais (token do bot) e caminho do arquivo do banco ficam fora do código, via variáveis de ambiente / secrets, nunca commitadas.
4. **Deploy containerizado** Segue o mesmo padrão já usado nos outros projetos: Docker no servidor pessoal, facilitando manutenção e isolamento.

## Escopo Inicial (MVP)

* `/gasto` — adiciona um lançamento de gasto no banco

## Modelo de Dados (MVP)

**`usuarios`**

* `id` (PK)
* `discord_id` — identificador único do usuário no Discord
* `guild_id` — servidor Discord onde ele interage
* `created_at`

**`categorias`**

* `id` (PK)
* `nome` — ex: "alimentação", "transporte"
* `tipo` — `gasto` ou `receita` (deixa o modelo pronto para quando `/receita` existir)
* `guild_id` — categorias podem variar por servidor

**`transacoes`**

* `id` (PK)
* `usuario_id` (FK → usuarios)
* `categoria_id` (FK → categorias)
* `tipo` — `gasto` ou `receita` (MVP só popula com `gasto`)
* `valor`
* `descricao` — texto livre, opcional
* `data` — data do gasto (pode diferir da data de registro)
* `created_at` — timestamp do lançamento no bot

Tabela `transacoes` é genérica (em vez de `gastos` e `receitas` separadas) para evitar duplicar schema e lógica de serviço quando comandos futuros como `/receita`, `/saldo` e `/extrato` forem implementados.

## Fora do escopo desta fase

Definição fina de: migrations e ORM específico, comandos adicionais (receita, extrato, saldo, orçamento por categoria, etc.), tratamento de erros, cache de categorias, controle de acesso (owner-only vs. qualquer usuário). Serão detalhados em documentos ou issues específicas conforme o projeto avança.
