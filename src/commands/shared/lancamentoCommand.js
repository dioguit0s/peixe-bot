const { SlashCommandBuilder } = require('discord.js');
const { getOrCreateUsuario } = require('../../services/usuarioService');
const { getOrCreateCategoria } = require('../../services/categoriaService');
const { registrarTransacao } = require('../../services/transacaoService');
const { buscarOrcamento, totalGastoNoPeriodo } = require('../../services/orcamentoService');
const { formatarData, formatarMoeda, parseMesParaIntervalo } = require('../../utils/formatters');

function criarComandoLancamento({ tipo, nome, descricao }) {
  return {
    data: new SlashCommandBuilder()
      .setName(nome)
      .setDescription(descricao)
      .addNumberOption((option) =>
        option.setName('valor').setDescription(`Valor do ${nome}`).setRequired(true).setMinValue(0.01),
      )
      .addStringOption((option) =>
        option.setName('categoria').setDescription(`Categoria do ${nome}`).setRequired(true),
      )
      .addStringOption((option) =>
        option.setName('descricao').setDescription(`Descrição opcional do ${nome}`).setRequired(false),
      )
      .addStringOption((option) =>
        option
          .setName('data')
          .setDescription(`Data do ${nome} no formato DD/MM/AAAA (padrão: hoje)`)
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
      const categoria = getOrCreateCategoria(categoriaNome, tipo, interaction.guildId);

      const transacao = registrarTransacao({
        usuarioId: usuario.id,
        categoriaId: categoria.id,
        tipo,
        valor,
        descricao,
        data,
      });

      const rotulo = tipo === 'receita' ? 'Receita registrada' : 'Gasto registrado';

      let aviso = '';
      if (tipo === 'gasto') {
        const orcamento = buscarOrcamento(usuario.id, categoria.id);
        if (orcamento) {
          const { dataInicio, dataFim } = parseMesParaIntervalo(null);
          const totalMes = totalGastoNoPeriodo(usuario.id, categoria.id, dataInicio, dataFim);

          if (totalMes > orcamento.valor_limite) {
            aviso = `\n⚠️ Você ultrapassou o limite mensal de **${categoria.nome}** (${formatarMoeda(
              totalMes,
            )} / ${formatarMoeda(orcamento.valor_limite)}).`;
          }
        }
      }

      await interaction.reply({
        content: `${rotulo}: **${formatarMoeda(transacao.valor)}** em **${categoria.nome}**${
          descricao ? ` — ${descricao}` : ''
        } (${data})${aviso}`,
        ephemeral: true,
      });
    },
  };
}

module.exports = { criarComandoLancamento };
