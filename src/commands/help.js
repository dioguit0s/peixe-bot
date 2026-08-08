const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const COR_EMBED = 0x3498db;

const CATEGORIAS = [
  {
    titulo: '💰 Transações',
    comandos: ['gasto', 'receita', 'remover'],
  },
  {
    titulo: '📊 Consultas',
    comandos: ['saldo', 'extrato', 'resumo'],
  },
  {
    titulo: '🏷️ Categorias',
    comandos: ['categoria', 'categorias'],
  },
  {
    titulo: '🎯 Orçamento',
    comandos: ['orcamento'],
  },
  {
    titulo: '⚙️ Outros',
    comandos: ['ping'],
  },
];

const COMANDOS = {
  gasto: {
    resumo: 'Registra um gasto',
    uso: '/gasto valor:<número> categoria:<texto> [descricao:<texto>] [data:<DD/MM/AAAA>]',
    parametros: [
      'valor (obrigatório): quanto foi gasto, ex. 49.90',
      'categoria (obrigatório): nome da categoria (é criada automaticamente se não existir)',
      'descricao (opcional): detalhe do gasto',
      'data (opcional): no formato DD/MM/AAAA — padrão é hoje',
    ],
    exemplo: '/gasto valor:49.90 categoria:mercado descricao:feira data:05/08/2026',
  },
  receita: {
    resumo: 'Registra uma receita',
    uso: '/receita valor:<número> categoria:<texto> [descricao:<texto>] [data:<DD/MM/AAAA>]',
    parametros: [
      'valor (obrigatório): quanto foi recebido, ex. 3000',
      'categoria (obrigatório): nome da categoria (é criada automaticamente se não existir)',
      'descricao (opcional): detalhe da receita',
      'data (opcional): no formato DD/MM/AAAA — padrão é hoje',
    ],
    exemplo: '/receita valor:3000 categoria:salario data:05/08/2026',
  },
  remover: {
    resumo: 'Remove um lançamento seu pelo ID',
    uso: '/remover id:<número>',
    parametros: ['id (obrigatório): o ID do lançamento, visto em /extrato'],
    exemplo: '/remover id:12',
  },
  saldo: {
    resumo: 'Mostra seu saldo atual (receitas − gastos)',
    uso: '/saldo',
    parametros: ['nenhum parâmetro'],
    exemplo: '/saldo',
  },
  extrato: {
    resumo: 'Lista seus últimos lançamentos',
    uso: '/extrato [quantidade:<número>] [categoria:<texto>] [mes:<MM/AAAA>]',
    parametros: [
      'quantidade (opcional): quantos lançamentos mostrar, de 1 a 25 — padrão 10',
      'categoria (opcional): filtra por nome de categoria',
      'mes (opcional): filtra por mês, no formato MM/AAAA',
    ],
    exemplo: '/extrato quantidade:20 mes:08/2026',
  },
  resumo: {
    resumo: 'Mostra o total gasto ou recebido por categoria em um mês',
    uso: '/resumo [mes:<MM/AAAA>] [tipo:<gasto|receita>]',
    parametros: [
      'mes (opcional): mês a resumir, no formato MM/AAAA — padrão é o mês atual',
      'tipo (opcional): gasto ou receita — padrão gasto',
    ],
    exemplo: '/resumo mes:08/2026 tipo:receita',
  },
  categoria: {
    resumo: 'Renomeia ou remove uma categoria',
    uso: '/categoria renomear categoria_atual:<texto> tipo:<gasto|receita> novo_nome:<texto>\n/categoria remover categoria:<texto> tipo:<gasto|receita>',
    parametros: [
      'renomear: categoria_atual, tipo e novo_nome (todos obrigatórios)',
      'remover: categoria e tipo (todos obrigatórios) — falha se houver lançamentos usando essa categoria',
    ],
    exemplo: '/categoria renomear categoria_atual:mercado tipo:gasto novo_nome:supermercado',
  },
  categorias: {
    resumo: 'Lista as categorias existentes no servidor',
    uso: '/categorias [tipo:<gasto|receita>]',
    parametros: ['tipo (opcional): filtra por gasto ou receita — padrão mostra as duas'],
    exemplo: '/categorias tipo:gasto',
  },
  orcamento: {
    resumo: 'Define, lista ou remove limites mensais de gasto por categoria',
    uso: '/orcamento definir categoria:<texto> tipo:<gasto|receita> valor:<número>\n/orcamento listar\n/orcamento remover categoria:<texto> tipo:<gasto|receita>',
    parametros: [
      'definir: categoria, tipo e valor (todos obrigatórios) — limite recorrente, vale todo mês',
      'listar: nenhum parâmetro — mostra o limite e o gasto atual do mês em cada categoria',
      'remover: categoria e tipo (todos obrigatórios)',
    ],
    exemplo: '/orcamento definir categoria:mercado tipo:gasto valor:800',
  },
  ping: {
    resumo: 'Testa se o bot está online',
    uso: '/ping',
    parametros: ['nenhum parâmetro'],
    exemplo: '/ping',
  },
};

function montarEmbedGeral() {
  const embed = new EmbedBuilder()
    .setColor(COR_EMBED)
    .setTitle('🐟 Central de Ajuda — Peixe Bot')
    .setDescription('Aqui estão todos os comandos disponíveis, organizados por finalidade.')
    .setFooter({ text: 'Use /help comando:<nome> para ver detalhes de um comando específico.' });

  for (const categoria of CATEGORIAS) {
    const linhas = categoria.comandos.map((nome) => `**/${nome}** — ${COMANDOS[nome].resumo}`);
    embed.addFields({ name: categoria.titulo, value: linhas.join('\n') });
  }

  return embed;
}

function montarEmbedComando(nome) {
  const info = COMANDOS[nome];
  return new EmbedBuilder()
    .setColor(COR_EMBED)
    .setTitle(`🐟 Ajuda — /${nome}`)
    .setDescription(info.resumo)
    .addFields(
      { name: 'Uso', value: `\`\`\`\n${info.uso}\n\`\`\`` },
      { name: 'Parâmetros', value: info.parametros.map((p) => `• ${p}`).join('\n') },
      { name: 'Exemplo', value: `\`${info.exemplo}\`` },
    );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Mostra os comandos disponíveis e como usá-los')
    .addStringOption((option) =>
      option
        .setName('comando')
        .setDescription('Nome do comando para ver detalhes')
        .setRequired(false)
        .addChoices(...Object.keys(COMANDOS).map((nome) => ({ name: `/${nome}`, value: nome }))),
    ),
  async execute(interaction) {
    const comando = interaction.options.getString('comando');
    const embed = comando ? montarEmbedComando(comando) : montarEmbedGeral();

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
