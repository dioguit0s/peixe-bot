const { criarComandoLancamento } = require('./shared/lancamentoCommand');

module.exports = criarComandoLancamento({
  tipo: 'receita',
  nome: 'receita',
  descricao: 'Registra uma receita',
});
