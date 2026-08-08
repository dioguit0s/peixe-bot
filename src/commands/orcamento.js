const { SlashCommandBuilder } = require('discord.js');
const { getOrCreateUsuario } = require('../services/usuarioService');
const { buscarCategoriaPorNome } = require('../services/categoriaService');
const { definirOrcamento, listarOrcamentos, removerOrcamento } = require('../services/orcamentoService');
const { formatarMoeda, parseMesParaIntervalo } = require('../utils/formatters');

function tipoOption(option) {
  return option
    .setName('tipo')
    .setDescription('Tipo da categoria')
    .setRequired(true)
    .addChoices({ name: 'gasto', value: 'gasto' }, { name: 'receita', value: 'receita' });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('orcamento')
    .setDescription('Gerencia limites mensais de orçamento por categoria')
    .addSubcommand((sub) =>
      sub
        .setName('definir')
        .setDescription('Define o limite mensal recorrente de uma categoria')
        .addStringOption((option) =>
          option.setName('categoria').setDescription('Nome da categoria').setRequired(true),
        )
        .addStringOption(tipoOption)
        .addNumberOption((option) =>
          option.setName('valor').setDescription('Valor limite mensal').setRequired(true).setMinValue(0.01),
        ),
    )
    .addSubcommand((sub) =>
      sub.setName('listar').setDescription('Mostra os limites definidos e o gasto atual do mês'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('remover')
        .setDescription('Remove o limite de uma categoria')
        .addStringOption((option) =>
          option.setName('categoria').setDescription('Nome da categoria').setRequired(true),
        )
        .addStringOption(tipoOption),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: 'Este comando só pode ser usado dentro de um servidor.',
        ephemeral: true,
      });
      return;
    }

    const subcomando = interaction.options.getSubcommand();
    const usuario = getOrCreateUsuario(interaction.user.id, interaction.guildId);

    if (subcomando === 'definir') {
      const categoriaNome = interaction.options.getString('categoria', true).trim().toLowerCase();
      const tipo = interaction.options.getString('tipo', true);
      const valor = interaction.options.getNumber('valor', true);

      const categoria = buscarCategoriaPorNome(categoriaNome, tipo, interaction.guildId);
      if (!categoria) {
        await interaction.reply({
          content: `Categoria **${categoriaNome}** (${tipo}) não encontrada.`,
          ephemeral: true,
        });
        return;
      }

      definirOrcamento({ usuarioId: usuario.id, categoriaId: categoria.id, valorLimite: valor });

      await interaction.reply({
        content: `Limite mensal de **${categoria.nome}** definido em **${formatarMoeda(valor)}**.`,
        ephemeral: true,
      });
      return;
    }

    if (subcomando === 'listar') {
      const { dataInicio, dataFim } = parseMesParaIntervalo(null);
      const orcamentos = listarOrcamentos(usuario.id, { dataInicio, dataFim });

      if (orcamentos.length === 0) {
        await interaction.reply({ content: 'Nenhum orçamento definido ainda.', ephemeral: true });
        return;
      }

      const linhas = orcamentos.map((o) => {
        const restante = o.valor_limite - o.gasto_atual;
        const aviso = o.gasto_atual > o.valor_limite ? ' ⚠️ acima do limite' : '';
        return `**${o.categoria_nome}** (${o.categoria_tipo}): ${formatarMoeda(o.gasto_atual)} / ${formatarMoeda(
          o.valor_limite,
        )} — restam ${formatarMoeda(restante)}${aviso}`;
      });

      await interaction.reply({ content: linhas.join('\n'), ephemeral: true });
      return;
    }

    if (subcomando === 'remover') {
      const categoriaNome = interaction.options.getString('categoria', true).trim().toLowerCase();
      const tipo = interaction.options.getString('tipo', true);

      const categoria = buscarCategoriaPorNome(categoriaNome, tipo, interaction.guildId);
      if (!categoria) {
        await interaction.reply({
          content: `Categoria **${categoriaNome}** (${tipo}) não encontrada.`,
          ephemeral: true,
        });
        return;
      }

      const removido = removerOrcamento(usuario.id, categoria.id);
      await interaction.reply({
        content: removido
          ? `Limite de **${categoria.nome}** removido.`
          : `Nenhum limite definido para **${categoria.nome}**.`,
        ephemeral: true,
      });
    }
  },
};
