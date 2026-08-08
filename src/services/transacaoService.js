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

function calcularSaldo(usuarioId) {
  const { saldo } = db
    .prepare(
      `SELECT COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END), 0) AS saldo
       FROM transacao
       WHERE usuario_id = ?`,
    )
    .get(usuarioId);

  return saldo;
}

function listarTransacoes(usuarioId, { categoriaIds, dataInicio, dataFim, limite = 10 } = {}) {
  const condicoes = ['t.usuario_id = ?'];
  const params = [usuarioId];

  if (categoriaIds && categoriaIds.length > 0) {
    condicoes.push(`t.categoria_id IN (${categoriaIds.map(() => '?').join(', ')})`);
    params.push(...categoriaIds);
  }

  if (dataInicio && dataFim) {
    condicoes.push('t.data BETWEEN ? AND ?');
    params.push(dataInicio, dataFim);
  }

  params.push(limite);

  return db
    .prepare(
      `SELECT t.*, c.nome AS categoria_nome
       FROM transacao t
       JOIN categoria c ON c.id = t.categoria_id
       WHERE ${condicoes.join(' AND ')}
       ORDER BY t.data DESC, t.id DESC
       LIMIT ?`,
    )
    .all(...params);
}

function buscarTransacaoPorId(id) {
  return db.prepare('SELECT * FROM transacao WHERE id = ?').get(id);
}

function removerTransacao(id, usuarioId) {
  const { changes } = db
    .prepare('DELETE FROM transacao WHERE id = ? AND usuario_id = ?')
    .run(id, usuarioId);

  return changes > 0;
}

function resumoPorCategoria(usuarioId, { tipo, dataInicio, dataFim }) {
  return db
    .prepare(
      `SELECT c.nome AS categoria, SUM(t.valor) AS total
       FROM transacao t
       JOIN categoria c ON c.id = t.categoria_id
       WHERE t.usuario_id = ? AND t.tipo = ? AND t.data BETWEEN ? AND ?
       GROUP BY c.id
       ORDER BY total DESC`,
    )
    .all(usuarioId, tipo, dataInicio, dataFim);
}

module.exports = {
  registrarTransacao,
  calcularSaldo,
  listarTransacoes,
  buscarTransacaoPorId,
  removerTransacao,
  resumoPorCategoria,
};
