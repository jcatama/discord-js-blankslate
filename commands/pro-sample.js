/**
 * @file leaderboard.js
 * @description Leaderboard command for the bot.
 */

const {
    SlashCommandBuilder,
    // PermissionFlagsBits,
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('sample')
    .setDescription('PRO sample file')
    .setDMPermission(false),
    // Below opt restrict member from seeing or executing this slash command
    // .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers),
    async execute(interaction, db) {

        if (!interaction.isChatInputCommand()) return;

        if (interaction.commandName !== 'sample') return

        return await interaction.reply('Hello!');
    }
};