# Roadmap pós-MVP

## Contexto

Com o `/gasto` implementado (ver [Arquitetura mvp.md](./Arquitetura%20mvp.md)), este documento lista os próximos comandos e features a desenvolver. O bot roda em um servidor compartilhado entre amigos, então **um usuário nunca pode ver dados financeiros de outro** — essa regra vale para todo comando novo, não só para os já existentes.

## Regra de privacidade (aplicar em todo comando novo)

* Toda resposta que exponha valores (`valor`, saldo, extrato, resumo) deve usar `ephemeral: true`.
* Toda query em `transacao` deve filtrar por `usuario_id` **e** `guild_id` — nunca só por `guild_id`.
* Comandos que alteram ou removem uma transação (editar, remover) precisam checar que o `usuario_id` da transação é o mesmo de quem chamou o comando, mesmo que o `id` seja passado manualmente.
* `categoria` não é dado privado (é taxonomia do servidor), então pode ser exibida publicamente sem problema.

## Essenciais (completam o ciclo básico)

* **`/receita`** — espelha o `/gasto`, mas com `tipo: 'receita'`. Reaproveita quase todo o código (`getOrCreateUsuario`, `getOrCreateCategoria`, `registrarTransacao`).
* **`/saldo`** — soma receitas − gastos do usuário no servidor. Resposta ephemeral.
* **`/extrato`** — últimas N transações do usuário, com filtro opcional de categoria/período. Resposta ephemeral.
* **`/remover`** (ou `/transacao remover <id>`) — apaga uma transação, validando que pertence a quem chamou.

## Consulta / visualização

* **`/resumo`** — total por categoria em um mês (ex: "Alimentação: R$ 320, Transporte: R$ 150"). Base para relatórios mais ricos depois (embed, gráfico).
* **`/categorias`** — lista categorias existentes por tipo (`gasto`/`receita`).

## Gestão de categorias

* **`/categoria renomear`** / **`/categoria remover`** — hoje a categoria só é criada automaticamente; sem isso, erros de digitação viram categorias "fantasma" permanentes.

## Planejamento (depois do básico)

* **`/orcamento definir <categoria> <valor>`** — define limite mensal por categoria, com aviso automático quando o usuário ultrapassar.
* **`/recorrente`** — gastos fixos mensais (aluguel, assinatura) que se lançam sozinhos.

## Ordem sugerida

1. `/receita` — reuso quase total do código do `/gasto`.
2. `/saldo` e `/extrato` — fecham o loop "registrar → consultar", que é o que todo usuário vai querer no dia seguinte ao primeiro registro.
3. `/remover` — necessário assim que existir mais de um lançamento, para corrigir erros de digitação.
4. Resto da lista, conforme a necessidade do grupo.
