const cron = require('node-cron');
const { registrarTransacao } = require('../services/transacaoService');
const { listarRecorrenciasParaLancarHoje, marcarLancamento } = require('../services/recorrenciaService');

function formatarDataISO(dataRef) {
  const ano = dataRef.getFullYear();
  const mes = String(dataRef.getMonth() + 1).padStart(2, '0');
  const dia = String(dataRef.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function executar(dataRef = new Date()) {
  const recorrencias = listarRecorrenciasParaLancarHoje(dataRef);
  const data = formatarDataISO(dataRef);
  const anoMes = data.slice(0, 7);

  for (const recorrencia of recorrencias) {
    registrarTransacao({
      usuarioId: recorrencia.usuario_id,
      categoriaId: recorrencia.categoria_id,
      tipo: recorrencia.tipo,
      valor: recorrencia.valor,
      descricao: recorrencia.descricao,
      data,
    });

    marcarLancamento(recorrencia.id, anoMes);
  }

  return recorrencias.length;
}

function iniciar() {
  cron.schedule('0 6 * * *', () => executar());
  console.log('Job de transações recorrentes agendado (diariamente às 06:00).');
}

module.exports = { iniciar, executar };
