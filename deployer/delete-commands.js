/**
 * Deletes all commands for a guild.
 */

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

const rest = new REST({ version: '10' }).setToken(token);
rest.get(Routes.applicationGuildCommands(clientId, guildId))
    .then(data => {
        const promises = [];
        for (const command of data) {
            const deleteUrl = `${Routes.applicationGuildCommands(clientId, guildId)}/${command.id}`;
            promises.push(rest.delete(deleteUrl));
        }
        return Promise.all(promises);
});