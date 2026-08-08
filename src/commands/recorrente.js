const { SlashCommandBuilder } = require('discord.js');
const { getOrCreateUsuario } = require('../services/usuarioService');
const { getOrCreateCategoria } = require('../services/categoriaService');
const {
  criarRecorrencia,
  listarRecorrencias,
  buscarRecorrenciaPorId,
  removerRecorrencia,
} = require('../services/recorrenciaService');
const { formatarMoeda } = require('../utils/formatters');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recorrente')
    .setDescription('Gerencia transações recorrentes mensais')
    .addSubcommand((sub) =>
      sub
        .setName('adicionar')
        .setDescription('Cria uma transação recorrente mensal')
        .addStringOption((option) =>
          option.setName('categoria').setDescription('Nome da categoria').setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName('tipo')
            .setDescription('Tipo da transação')
            .setRequired(true)
            .addChoices({ name: 'gasto', value: 'gasto' }, { name: 'receita', value: 'receita' }),
        )
        .addNumberOption((option) =>
          option.setName('valor').setDescription('Valor da transação').setRequired(true).setMinValue(0.01),
        )
        .addIntegerOption((option) =>
          option
            .setName('dia_mes')
            .setDescription('Dia do mês em que a transação é lançada (1-31)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(31),
        )
        .addStringOption((option) =>
          option.setName('descricao').setDescription('Descrição opcional').setRequired(false),
        ),
    )
    .addSubcommand((sub) => sub.setName('listar').setDescription('Lista suas transações recorrentes'))
    .addSubcommand((sub) =>
      sub
        .setName('remover')
        .setDescription('Remove uma transação recorrente')
        .addIntegerOption((option) =>
          option.setName('id').setDescription('ID da transação recorrente').setRequired(true).setMinValue(1),
        ),
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

    if (subcomando === 'adicionar') {
      const categoriaNome = interaction.options.getString('categoria', true).trim().toLowerCase();
      const tipo = interaction.options.getString('tipo', true);
      const valor = interaction.options.getNumber('valor', true);
      const diaMes = interaction.options.getInteger('dia_mes', true);
      const descricao = interaction.options.getString('descricao');

      const categoria = getOrCreateCategoria(categoriaNome, tipo, interaction.guildId);

      const recorrencia = criarRecorrencia({
        usuarioId: usuario.id,
        categoriaId: categoria.id,
        tipo,
        valor,
        descricao,
        diaMes,
      });

      await interaction.reply({
        content: `Recorrência **#${recorrencia.id}** criada: **${formatarMoeda(valor)}** em **${
          categoria.nome
        }** todo dia ${diaMes}${descricao ? ` — ${descricao}` : ''}.`,
        ephemeral: true,
      });
      return;
    }

    if (subcomando === 'listar') {
      const recorrencias = listarRecorrencias(usuario.id);

      if (recorrencias.length === 0) {
        await interaction.reply({ content: 'Nenhuma transação recorrente cadastrada.', ephemeral: true });
        return;
      }

      const linhas = recorrencias.map((r) => {
        const sinal = r.tipo === 'receita' ? '+' : '-';
        return `\`#${r.id}\` dia ${r.dia_mes}: ${sinal}${formatarMoeda(r.valor)} — **${r.categoria_nome}**${
          r.descricao ? ` (${r.descricao})` : ''
        }`;
      });

      await interaction.reply({ content: linhas.join('\n'), ephemeral: true });
      return;
    }

    if (subcomando === 'remover') {
      const id = interaction.options.getInteger('id', true);
      const recorrencia = buscarRecorrenciaPorId(id);

      if (!recorrencia || recorrencia.usuario_id !== usuario.id) {
        await interaction.reply({ content: 'Transação recorrente não encontrada.', ephemeral: true });
        return;
      }

      removerRecorrencia(id, usuario.id);

      await interaction.reply({
        content: `Recorrência **#${id}** removida.`,
        ephemeral: true,
      });
    }
  },
};
