const { SlashCommandBuilder } = require('discord.js');
const { getOrCreateUsuario } = require('../services/usuarioService');
const { getOrCreateCategoria } = require('../services/categoriaService');
const { registrarTransacao } = require('../services/transacaoService');

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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gasto')
    .setDescription('Registra um gasto')
    .addNumberOption((option) =>
      option.setName('valor').setDescription('Valor do gasto').setRequired(true).setMinValue(0.01),
    )
    .addStringOption((option) =>
      option.setName('categoria').setDescription('Categoria do gasto').setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('descricao').setDescription('Descrição opcional do gasto').setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName('data')
        .setDescription('Data do gasto no formato DD/MM/AAAA (padrão: hoje)')
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

    const valor = interaction.options.getNumber('valor', true);
    const categoriaNome = interaction.options.getString('categoria', true).trim().toLowerCase();
    const descricao = interaction.options.getString('descricao');
    const data = formatarData(interaction.options.getString('data'));

    if (!data) {
      await interaction.reply({
        content: 'Data inválida. Use o formato DD/MM/AAAA.',
        ephemeral: true,
      });
      return;
    }

    const usuario = getOrCreateUsuario(interaction.user.id, interaction.guildId);
    const categoria = getOrCreateCategoria(categoriaNome, 'gasto', interaction.guildId);

    const transacao = registrarTransacao({
      usuarioId: usuario.id,
      categoriaId: categoria.id,
      tipo: 'gasto',  
      valor,
      descricao,
      data,
    });

    const valorFormatado = transacao.valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    await interaction.reply({
      content: `Gasto registrado: **${valorFormatado}** em **${categoria.nome}**${
        descricao ? ` — ${descricao}` : ''
      } (${data})`,
      ephemeral: true,
    });
  },
};
