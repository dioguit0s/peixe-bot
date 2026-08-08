const db = require('../db/connection');

function registrarTransacao({ usuarioId, categoriaId, tipo, valor, descricao, data }) {
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO transacao (usuario_id, categoria_id, tipo, valor, descricao, data)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(usuarioId, categoriaId, tipo, valor, descricao ?? null, data);

  return db.prepare('SELECT * FROM transacao WHERE id = ?').get(lastInsertRowid);
}

module.exports = { registrarTransacao };
