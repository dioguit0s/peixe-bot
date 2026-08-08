const db = require('../db/connection');

function definirOrcamento({ usuarioId, categoriaId, valorLimite }) {
  db.prepare(
    `INSERT INTO orcamento (usuario_id, categoria_id, valor_limite)
     VALUES (?, ?, ?)
     ON CONFLICT (usuario_id, categoria_id) DO UPDATE SET valor_limite = excluded.valor_limite`,
  ).run(usuarioId, categoriaId, valorLimite);

  return db
    .prepare('SELECT * FROM orcamento WHERE usuario_id = ? AND categoria_id = ?')
    .get(usuarioId, categoriaId);
}

function listarOrcamentos(usuarioId, { dataInicio, dataFim }) {
  return db
    .prepare(
      `SELECT o.*, c.nome AS categoria_nome, c.tipo AS categoria_tipo,
         COALESCE(
           (SELECT SUM(t.valor) FROM transacao t
            WHERE t.usuario_id = o.usuario_id AND t.categoria_id = o.categoria_id
              AND t.data BETWEEN ? AND ?),
           0
         ) AS gasto_atual
       FROM orcamento o
       JOIN categoria c ON c.id = o.categoria_id
       WHERE o.usuario_id = ?
       ORDER BY c.nome`,
    )
    .all(dataInicio, dataFim, usuarioId);
}

function buscarOrcamento(usuarioId, categoriaId) {
  return db
    .prepare('SELECT * FROM orcamento WHERE usuario_id = ? AND categoria_id = ?')
    .get(usuarioId, categoriaId);
}

function removerOrcamento(usuarioId, categoriaId) {
  const { changes } = db
    .prepare('DELETE FROM orcamento WHERE usuario_id = ? AND categoria_id = ?')
    .run(usuarioId, categoriaId);

  return changes > 0;
}

function totalGastoNoPeriodo(usuarioId, categoriaId, dataInicio, dataFim) {
  const { total } = db
    .prepare(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM transacao
       WHERE usuario_id = ? AND categoria_id = ? AND data BETWEEN ? AND ?`,
    )
    .get(usuarioId, categoriaId, dataInicio, dataFim);

  return total;
}

module.exports = {
  definirOrcamento,
  listarOrcamentos,
  buscarOrcamento,
  removerOrcamento,
  totalGastoNoPeriodo,
};
