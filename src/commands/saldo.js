const { SlashCommandBuilder } = require('discord.js');
const { getOrCreateUsuario } = require('../services/usuarioService');
const { calcularSaldo } = require('../services/transacaoService');
const { formatarMoeda } = require('../utils/formatters');

module.exports = {
  data: new SlashCommandBuilder().setName('saldo').setDescription('Mostra seu saldo (receitas − gastos)'),
  async execute(interaction) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: 'Este comando só pode ser usado dentro de um servidor.',
        ephemeral: true,
      });
      return;
    }

    const usuario = getOrCreateUsuario(interaction.user.id, interaction.guildId);
    const saldo = calcularSaldo(usuario.id);

    const sinal = saldo > 0 ? 'positivo' : saldo < 0 ? 'negativo' : 'neutro';

    await interaction.reply({
      content: `Seu saldo é **${formatarMoeda(saldo)}** (${sinal}).`,
      ephemeral: true,
    });
  },
};
