const db = require('../db/connection');
const { ultimoDiaDoMes } = require('../utils/formatters');

function criarRecorrencia({ usuarioId, categoriaId, tipo, valor, descricao, diaMes }) {
  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO transacao_recorrente (usuario_id, categoria_id, tipo, valor, descricao, dia_mes)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(usuarioId, categoriaId, tipo, valor, descricao ?? null, diaMes);

  return db.prepare('SELECT * FROM transacao_recorrente WHERE id = ?').get(lastInsertRowid);
}

function listarRecorrencias(usuarioId) {
  return db
    .prepare(
      `SELECT r.*, c.nome AS categoria_nome
       FROM transacao_recorrente r
       JOIN categoria c ON c.id = r.categoria_id
       WHERE r.usuario_id = ?
       ORDER BY r.dia_mes, c.nome`,
    )
    .all(usuarioId);
}

function buscarRecorrenciaPorId(id) {
  return db.prepare('SELECT * FROM transacao_recorrente WHERE id = ?').get(id);
}

function removerRecorrencia(id, usuarioId) {
  const { changes } = db
    .prepare('DELETE FROM transacao_recorrente WHERE id = ? AND usuario_id = ?')
    .run(id, usuarioId);

  return changes > 0;
}

function listarRecorrenciasParaLancarHoje(dataRef) {
  const ano = dataRef.getFullYear();
  const mes = dataRef.getMonth() + 1;
  const anoMes = `${ano}-${String(mes).padStart(2, '0')}`;
  const diaHoje = dataRef.getDate();
  const ultimoDia = ultimoDiaDoMes(ano, mes);

  const candidatas = db
    .prepare(
      `SELECT * FROM transacao_recorrente
       WHERE ativo = 1 AND (ultimo_lancamento IS NULL OR ultimo_lancamento != ?)`,
    )
    .all(anoMes);

  return candidatas.filter((r) => Math.min(r.dia_mes, ultimoDia) === diaHoje);
}

function marcarLancamento(id, anoMes) {
  db.prepare('UPDATE transacao_recorrente SET ultimo_lancamento = ? WHERE id = ?').run(anoMes, id);
}

module.exports = {
  criarRecorrencia,
  listarRecorrencias,
  buscarRecorrenciaPorId,
  removerRecorrencia,
  listarRecorrenciasParaLancarHoje,
  marcarLancamento,
};
