const db = require('../db/connection');

function getOrCreateUsuario(discordId, guildId) {
  const existente = db
    .prepare('SELECT * FROM usuario WHERE discord_id = ? AND guild_id = ?')
    .get(discordId, guildId);

  if (existente) return existente;

  const { lastInsertRowid } = db
    .prepare('INSERT INTO usuario (discord_id, guild_id) VALUES (?, ?)')
    .run(discordId, guildId);

  return db.prepare('SELECT * FROM usuario WHERE id = ?').get(lastInsertRowid);
}

module.exports = { getOrCreateUsuario };
