const { SlashCommandBuilder } = require('discord.js');
const { getOrCreateUsuario } = require('../services/usuarioService');
const { resumoPorCategoria } = require('../services/transacaoService');
const { formatarMoeda, parseMesParaIntervalo } = require('../utils/formatters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resumo')
    .setDescription('Resumo por categoria em um mês')
    .addStringOption((option) =>
      option
        .setName('mes')
        .setDescription('Mês no formato MM/AAAA (padrão: mês atual)')
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('tipo')
        .setDescription('Tipo de transação (padrão: gasto)')
        .setRequired(false)
        .addChoices({ name: 'gasto', value: 'gasto' }, { name: 'receita', value: 'receita' }),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: 'Este comando só pode ser usado dentro de um servidor.',
        ephemeral: true,
      });
      return;
    }

    const tipo = interaction.options.getString('tipo') ?? 'gasto';
    const intervalo = parseMesParaIntervalo(interaction.options.getString('mes'));

    if (!intervalo) {
      await interaction.reply({
        content: 'Mês inválido. Use o formato MM/AAAA.',
        ephemeral: true,
      });
      return;
    }

    const usuario = getOrCreateUsuario(interaction.user.id, interaction.guildId);
    const resumo = resumoPorCategoria(usuario.id, {
      tipo,
      dataInicio: intervalo.dataInicio,
      dataFim: intervalo.dataFim,
    });

    if (resumo.length === 0) {
      await interaction.reply({
        content: `Nenhuma transação do tipo **${tipo}** encontrada nesse período.`,
        ephemeral: true,
      });
      return;
    }

    const linhas = resumo.map((r) => `**${r.categoria}**: ${formatarMoeda(r.total)}`);

    await interaction.reply({ content: linhas.join('\n'), ephemeral: true });
  },
};
