const { SlashCommandBuilder } = require('discord.js');
const { listarCategorias } = require('../services/categoriaService');

function formatarSecao(titulo, categorias) {
  if (categorias.length === 0) return `**${titulo}**: nenhuma categoria ainda.`;
  return `**${titulo}**: ${categorias.map((c) => c.nome).join(', ')}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('categorias')
    .setDescription('Lista as categorias existentes no servidor')
    .addStringOption((option) =>
      option
        .setName('tipo')
        .setDescription('Filtrar por tipo (padrão: mostra as duas)')
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

    const tipo = interaction.options.getString('tipo');

    let linhas;
    if (tipo) {
      linhas = [formatarSecao(tipo, listarCategorias(interaction.guildId, tipo))];
    } else {
      linhas = [
        formatarSecao('gasto', listarCategorias(interaction.guildId, 'gasto')),
        formatarSecao('receita', listarCategorias(interaction.guildId, 'receita')),
      ];
    }

    await interaction.reply({ content: linhas.join('\n') });
  },
};
