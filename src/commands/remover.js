const { SlashCommandBuilder } = require('discord.js');
const { getOrCreateUsuario } = require('../services/usuarioService');
const { buscarTransacaoPorId, removerTransacao } = require('../services/transacaoService');
const { formatarMoeda } = require('../utils/formatters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remover')
    .setDescription('Remove uma transação sua')
    .addIntegerOption((option) =>
      option.setName('id').setDescription('ID da transação a remover').setRequired(true).setMinValue(1),
    ),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: 'Este comando só pode ser usado dentro de um servidor.',
        ephemeral: true,
      });
      return;
    }

    const id = interaction.options.getInteger('id', true);
    const usuario = getOrCreateUsuario(interaction.user.id, interaction.guildId);
    const transacao = buscarTransacaoPorId(id);

    if (!transacao || transacao.usuario_id !== usuario.id) {
      await interaction.reply({
        content: 'Transação não encontrada.',
        ephemeral: true,
      });
      return;
    }

    removerTransacao(id, usuario.id);

    await interaction.reply({
      content: `Transação removida: **${formatarMoeda(transacao.valor)}** (${transacao.data}).`,
      ephemeral: true,
    });
  },
};
