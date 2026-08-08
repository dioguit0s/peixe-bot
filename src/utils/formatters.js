function formatarData(dataStr) {
  if (!dataStr) {
    return new Date().toISOString().slice(0, 10);
  }

  const bruta = dataStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (bruta) {
    const [, dia, mes, ano] = bruta;
    return `${ano}-${mes}-${dia}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
    return dataStr;
  }

  return null;
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function ultimoDiaDoMes(ano, mes) {
  return new Date(ano, mes, 0).getDate();
}

function parseMesParaIntervalo(mesStr) {
  let ano;
  let mes;

  if (!mesStr) {
    const hoje = new Date();
    ano = hoje.getFullYear();
    mes = hoje.getMonth() + 1;
  } else {
    const bruta = mesStr.match(/^(\d{2})\/(\d{4})$/);
    if (!bruta) return null;

    mes = Number(bruta[1]);
    ano = Number(bruta[2]);
    if (mes < 1 || mes > 12) return null;
  }

  const mesFormatado = String(mes).padStart(2, '0');
  const dataInicio = `${ano}-${mesFormatado}-01`;
  const dataFim = `${ano}-${mesFormatado}-${String(ultimoDiaDoMes(ano, mes)).padStart(2, '0')}`;

  return { dataInicio, dataFim };
}

module.exports = { formatarData, formatarMoeda, parseMesParaIntervalo };
