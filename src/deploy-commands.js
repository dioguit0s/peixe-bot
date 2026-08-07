const fs = require('node:fs');
const path = require('node:path');
const { REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('./config/env');

const commandsPath = path.join(__dirname, 'commands');
const commands = [];

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));

    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.warn(`[AVISO] Comando em ${file} não possui "data" ou "execute".`);
    }
  }
}

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(`Registrando ${commands.length} slash command(s)...`);

    const route = guildId
      ? Routes.applicationGuildCommands(clientId, guildId)
      : Routes.applicationCommands(clientId);

    const data = await rest.put(route, { body: commands });

    console.log(`${data.length} slash command(s) registrado(s) com sucesso.`);
  } catch (error) {
    console.error('Falha ao registrar slash commands:', error);
    process.exitCode = 1;
  }
})();
