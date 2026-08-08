const { SlashCommandBuilder } = require('discord.js');
const { getOrCreateUsuario } = require('../services/usuarioService');
const { buscarCategoriasPorNome } = require('../services/categoriaService');
const { listarTransacoes } = require('../services/transacaoService');
const { formatarMoeda, parseMesParaIntervalo } = require('../utils/formatters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('extrato')
    .setDescription('Lista suas últimas transações')
    .addIntegerOption((option) =>
      option
        .setName('quantidade')
        .setDescription('Quantidade de transações a exibir (padrão: 10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(25),
    )
    .addStringOption((option) =>
      option.setName('categoria').setDescription('Filtrar por categoria').setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('mes')
        .setDescription('Filtrar por mês no formato MM/AAAA')
        .setRequired(false),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: 'Este comando só pode ser usado dentro de um servidor.',
        ephemeral: true,
      });
      return;
    }

    const quantidade = interaction.options.getInteger('quantidade') ?? 10;
    const categoriaNome = interaction.options.getString('categoria')?.trim().toLowerCase();
    const mesStr = interaction.options.getString('mes');

    let intervalo;
    if (mesStr) {
      intervalo = parseMesParaIntervalo(mesStr);
      if (!intervalo) {
        await interaction.reply({
          content: 'Mês inválido. Use o formato MM/AAAA.',
          ephemeral: true,
        });
        return;
      }
    }

    let categoriaIds;
    if (categoriaNome) {
      const categorias = buscarCategoriasPorNome(categoriaNome, interaction.guildId);
      if (categorias.length === 0) {
        await interaction.reply({
          content: `Nenhuma categoria chamada **${categoriaNome}** encontrada.`,
          ephemeral: true,
        });
        return;
      }
      categoriaIds = categorias.map((c) => c.id);
    }

    const usuario = getOrCreateUsuario(interaction.user.id, interaction.guildId);
    const transacoes = listarTransacoes(usuario.id, {
      categoriaIds,
      dataInicio: intervalo?.dataInicio,
      dataFim: intervalo?.dataFim,
      limite: quantidade,
    });

    if (transacoes.length === 0) {
      await interaction.reply({ content: 'Nenhuma transação encontrada.', ephemeral: true });
      return;
    }

    const linhas = transacoes.map((t) => {
      const sinal = t.tipo === 'receita' ? '+' : '-';
      return `\`${t.data}\` ${sinal}${formatarMoeda(t.valor)} — **${t.categoria_nome}**${
        t.descricao ? ` (${t.descricao})` : ''
      }`;
    });

    await interaction.reply({ content: linhas.join('\n'), ephemeral: true });
  },
};
