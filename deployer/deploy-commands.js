/**
 * Deploys application commands to a guild.
 */

const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');

const commander = require('commander');

commander
    .usage('[OPTIONS]...')
    .option('-c, --client_id <value>', 'Bot client ID.')
    .option('-g, --guild_id <value>', 'Guild ID.')
    .option('-t, --token <value>', 'Bot token.')
    .parse(process.argv);

const options = commander.opts();

const clientId = options.client_id;
const guildId = options.guild_id;
const token = options.token;

const commands = [];
const commandsPath = path.join(__dirname, '..', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    console.log(filePath)
    const command = require(filePath);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);