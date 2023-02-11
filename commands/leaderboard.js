/**
 * @file leaderboard.js
 * @description Leaderboard command for the bot.
 */

const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputStyle,
    TextInputBuilder,
    ActionRowBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    Colors
} = require('discord.js');
const { renderLeaderboard } = require('../classes/class-index.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Leaderboard command.')
    .setDMPermission(false)
    // Below opt restrict member from seeing or executing this slash command
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers)
    .addSubcommand(subcommand =>
        subcommand
            .setName('create')
            .setDescription('Initialize leaderboard in the current channel.')
            .addStringOption(option =>
                option
                    .setName('title')
                    .setDescription('Leaderboard title.')
                    .setRequired(true)
            )
            .addIntegerOption(option =>
                option
                    .setName('target_points')
                    .setDescription('Target points to win.')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('prize')
                    .setDescription('Prize to win.')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option
                    .setName('thumbnail')
                    .setDescription('Message thumbnail.')
                    .setRequired(true)
            )
    ).addSubcommand(subcommand =>
        subcommand
            .setName('ask')
            .setDescription('Ask question.')
    ).addSubcommand(subcommand =>
        subcommand
            .setName('add')
            .setDescription('Add or Deduct points from user')
            .addIntegerOption(option =>
                option
                    .setName('points')
                    .setDescription('Point/s to be added or subtracted. Use negative sign to deduct.')
                    .setRequired(true)
            )
            .addUserOption(option =>
                option
                    .setName('user')
                    .setDescription('User to receive/deduct the points')
                    .setRequired(true)
            )
    ),
    async execute(interaction, db) {

        if (!interaction.isChatInputCommand()) return;

        if (interaction.commandName !== 'leaderboard') return

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {

		    const title = interaction.options.getString('title');
            const target_points = interaction.options.getInteger('target_points');
            const prize = interaction.options.getString('prize');
            const thumbnail = interaction.options.getString('thumbnail');

            let leaderboard  = null
            try {
                const disableStatus = await db.Leaderboards.update(
                    { status : 0 },
                    { where : { status : 1 }}
                );
                if (disableStatus) {
                    leaderboard = await db.Leaderboards.create({
                        channel_id: interaction.channel.id,
                        title: title,
                        target_points: target_points,
                        prize: prize,
                        thumbnail: thumbnail ? thumbnail : null
                    });
                } else {
                    return await interaction.reply( { content: 'Something went wrong disabling old leaderboard records.', ephemeral: true });
                }
            } catch (error) {
                if (error.name === 'SequelizeUniqueConstraintError') {
                    return await interaction.reply('Leaderboard already exists.');
                }
                return await interaction.reply( { content: 'Something went wrong creating a new leaderboard record.', ephemeral: true });
            }

            let description = `**Target points:** \`${target_points}\``
            description += `\n**Prize:** \`${prize}\``

            let embed = new EmbedBuilder()
                    .setColor(Colors.Gold)
                    .setTitle(title)
                    // .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(description)
                    .setThumbnail(thumbnail)
                    .setTimestamp();

            await interaction.reply({ embeds: [embed] });
            const message = await interaction.fetchReply()

            try {
                leaderboard.message_id = message.id
                leaderboard.content = description
                leaderboard.save();
            } catch (error) {
                console.log(error)
                return await interaction.reply( { content: 'Something went wrong updating leaderboard content record.', ephemeral: true });
            }

            return

        } else if (subcommand === 'ask') {
            const modal = new ModalBuilder()
                .setCustomId('askQuestion')
                .setTitle("Ask Question for points");

            const question = new TextInputBuilder()
                .setCustomId('question')
                .setLabel("Your question")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const answer = new TextInputBuilder()
                .setCustomId('answer')
                .setLabel("Answer to the question")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const points = new TextInputBuilder()
                .setCustomId('points')
                .setLabel("Points to win")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const media = new TextInputBuilder()
                .setCustomId('media')
                .setLabel("Media Link")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("i.e https://i.imgur.com/0X0X0X0.(png|jpg|gif)")
                .setRequired(false);

            const q1 = new ActionRowBuilder().addComponents(question);
            const q2 = new ActionRowBuilder().addComponents(answer);
            const q3 = new ActionRowBuilder().addComponents(points);
            const q4 = new ActionRowBuilder().addComponents(media);

            modal.addComponents(q1, q2, q3, q4);
            await interaction.showModal(modal);

        } else if (subcommand === 'add') {
            const user = interaction.options.getUser('user')
            const points = interaction.options.getInteger('points');

            let activeLeaderboard = await db.Leaderboards.findOne({ where: { status: 1 } });
            let userExist = await db.Points.findOne({
                where: {
                    user_id: user.id,
                    leaderboard_id: activeLeaderboard.id
                }
            });
            if (userExist) {
                try {
                    const newPoints = userExist.points + parseInt(points)
                    if (newPoints < 0) {
                        return await interaction.reply({
                            content: 'Not allowed',
                            ephemeral: true
                        });
                    }
                    userExist.points = newPoints
                    userExist.save()

                    const winner = await renderLeaderboard(db, interaction)
                    if (winner) {
                        await interaction.reply(`Congrats 🎉 ${user}! You have won: ${activeLeaderboard.prize} 🎉  <#${activeLeaderboard.channel_id}>`);
                    } else {
                        let _type = 'added to'
                        if (parseInt(points) < 0) _type = 'deducted from'
                        await interaction.reply(`${points} was ${_type} ${user}. Total points: \`${newPoints}\`  <#${activeLeaderboard.channel_id}>`);
                    }
                } catch (error) {
                    console.log(error)
                }
            } else {
                try {
                    if (parseInt(points) < 1) {
                        return await interaction.reply({
                            content: 'Invalid points.',
                            ephemeral: true
                        });
                    }
                    if (activeLeaderboard) {
                        await db.Points.create({
                            user_id: user.id,
                            username: user.username,
                            leaderboard_id: activeLeaderboard.id,
                            points: parseInt(points)
                        });
                        const winner = await renderLeaderboard(db, interaction)
                        if (winner) {
                            await interaction.reply(`Congrats 🎉 ${user}! You have won: ${activeLeaderboard.prize} 🎉  <#${activeLeaderboard.channel_id}>`);
                        } else {
                            await interaction.reply(`Welcome to leaderboard ${user}! Your total points: \`${points}\`  <#${activeLeaderboard.channel_id}>`);
                        }
                    } else {
                        await interaction.reply({
                            content: 'There was no active leaderboard',
                            ephemeral: true
                        });
                    }
                } catch (error) {
                    console.log(error)
                    await interaction.reply({
                        content: `Something went wrong while adding ${points} point/s to ${user}`,
                        ephemeral: true
                    });
                }
            }
        }

        return
    }
};