const db = require('../db/connection');

function getOrCreateCategoria(nome, tipo, guildId) {
  const existente = db
    .prepare('SELECT * FROM categoria WHERE nome = ? AND tipo = ? AND guild_id = ?')
    .get(nome, tipo, guildId);

  if (existente) return existente;

  const { lastInsertRowid } = db
    .prepare('INSERT INTO categoria (nome, tipo, guild_id) VALUES (?, ?, ?)')
    .run(nome, tipo, guildId);

  return db.prepare('SELECT * FROM categoria WHERE id = ?').get(lastInsertRowid);
}

function listarCategorias(guildId, tipo) {
  return db
    .prepare('SELECT * FROM categoria WHERE guild_id = ? AND tipo = ? ORDER BY nome')
    .all(guildId, tipo);
}

module.exports = { getOrCreateCategoria, listarCategorias };
