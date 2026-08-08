CREATE TABLE IF NOT EXISTS usuario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  discord_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (discord_id, guild_id)
);

CREATE TABLE IF NOT EXISTS categoria (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('gasto', 'receita')),
  guild_id TEXT NOT NULL,
  UNIQUE (nome, tipo, guild_id)
);

CREATE TABLE IF NOT EXISTS transacao (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuario (id),
  categoria_id INTEGER NOT NULL REFERENCES categoria (id),
  tipo TEXT NOT NULL CHECK (tipo IN ('gasto', 'receita')),
  valor REAL NOT NULL,
  descricao TEXT,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_transacao_usuario ON transacao (usuario_id);
CREATE INDEX IF NOT EXISTS idx_transacao_categoria ON transacao (categoria_id);

CREATE TABLE IF NOT EXISTS orcamento (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL REFERENCES usuario (id),
  categoria_id INTEGER NOT NULL REFERENCES categoria (id),
  valor_limite REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (usuario_id, categoria_id)
);
