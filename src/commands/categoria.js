const { SlashCommandBuilder } = require('discord.js');
const { buscarCategoriaPorNome, renomearCategoria, removerCategoria } = require('../services/categoriaService');

function tipoOption(option) {
  return option
    .setName('tipo')
    .setDescription('Tipo da categoria')
    .setRequired(true)
    .addChoices({ name: 'gasto', value: 'gasto' }, { name: 'receita', value: 'receita' });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('categoria')
    .setDescription('Gerencia categorias do servidor')
    .addSubcommand((sub) =>
      sub
        .setName('renomear')
        .setDescription('Renomeia uma categoria existente')
        .addStringOption((option) =>
          option.setName('categoria_atual').setDescription('Nome atual da categoria').setRequired(true),
        )
        .addStringOption(tipoOption)
        .addStringOption((option) =>
          option.setName('novo_nome').setDescription('Novo nome da categoria').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('remover')
        .setDescription('Remove uma categoria sem transações')
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

    if (subcomando === 'renomear') {
      const nomeAtual = interaction.options.getString('categoria_atual', true).trim().toLowerCase();
      const tipo = interaction.options.getString('tipo', true);
      const novoNome = interaction.options.getString('novo_nome', true).trim().toLowerCase();

      const categoria = buscarCategoriaPorNome(nomeAtual, tipo, interaction.guildId);
      if (!categoria) {
        await interaction.reply(`Categoria **${nomeAtual}** (${tipo}) não encontrada.`);
        return;
      }

      const atualizada = renomearCategoria(categoria.id, novoNome);
      await interaction.reply(`Categoria **${categoria.nome}** renomeada para **${atualizada.nome}**.`);
      return;
    }

    if (subcomando === 'remover') {
      const nome = interaction.options.getString('categoria', true).trim().toLowerCase();
      const tipo = interaction.options.getString('tipo', true);

      const categoria = buscarCategoriaPorNome(nome, tipo, interaction.guildId);
      if (!categoria) {
        await interaction.reply(`Categoria **${nome}** (${tipo}) não encontrada.`);
        return;
      }

      try {
        removerCategoria(categoria.id);
        await interaction.reply(`Categoria **${categoria.nome}** removida.`);
      } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
          await interaction.reply(
            `Categoria **${categoria.nome}** não pode ser removida: já existem transações usando ela.`,
          );
          return;
        }
        throw error;
      }
    }
  },
};
