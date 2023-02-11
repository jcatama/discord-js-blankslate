/**
 * @name ModalSubmission
 * @description This class is responsible for handling modal submissions
 */

const {
    Colors,
    EmbedBuilder
} = require("discord.js");
const { renderLeaderboard } = require('../classes/class-index.js')

class ModalSubmission {

    /**
     * @param {Client} client
     * @param {DB} db
     */
    constructor(client, db) {

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isModalSubmit()) return;

            if (interaction.customId === 'askQuestion') {

                const question = interaction.fields.getTextInputValue('question');
                const answer = interaction.fields.getTextInputValue('answer');
                const points = interaction.fields.getTextInputValue('points');
                const media = interaction.fields.getTextInputValue('media');

                let embed = new EmbedBuilder()
                    .setColor(Colors.Yellow)
                    .setTitle('QUIZ!')
                    .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
                    .setDescription(question)
                    .setTimestamp();

                if(media) {
                    embed.setThumbnail(media)
                }

                const filter = response => {
                    return answer.toLowerCase() === response.content.toLowerCase();
                };

                interaction.reply({ embeds: [embed], fetchReply: true })
                .then(() => {
                    interaction.channel.awaitMessages({ filter, max: 1, errors: ['time'] })
                        .then(async (collected) => {

                            const user = collected.first().author

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
                                    userExist.points = newPoints
                                    userExist.save()
                                    const winner = await renderLeaderboard(db, interaction)
                                    if (winner) {
                                        interaction.followUp(`Congrats 🎉 ${user}! You have won: ${activeLeaderboard.prize} 🎉  <#${activeLeaderboard.channel_id}>`);
                                    } else {
                                        interaction.followUp(`${user} got the correct answer and earned total of ${newPoints} points!  <#${activeLeaderboard.channel_id}>`);
                                    }
                                } catch (error) {
                                    console.log(e)
                                }
                            } else {
                                let userPoint  = null
                                try {
                                    if (activeLeaderboard) {
                                        userPoint = await db.Points.create({
                                            user_id: user.id,
                                            username: user.username,
                                            leaderboard_id: activeLeaderboard.id,
                                            points: parseInt(points)
                                        });
                                        const winner = await renderLeaderboard(db, interaction)
                                        if (winner) {
                                            interaction.followUp(`Congrats 🎉 ${user}! You have won: ${activeLeaderboard.prize} 🎉  <#${activeLeaderboard.channel_id}>`);
                                        } else {
                                            interaction.followUp(`${user} got the correct answer and earned ${points} points!  <#${activeLeaderboard.channel_id}>`);
                                        }
                                    } else {
                                        interaction.followUp({
                                            content: 'There was no active leaderboard',
                                            ephemeral: true
                                        });
                                    }
                                } catch (error) {
                                    console.log(error)
                                    interaction.followUp({
                                        content: `Something went wrong while adding ${points} point/s to ${collected.first().author}`,
                                        ephemeral: true
                                    });
                                }
                            }

                        })
                        .catch(async (collected) => {
                            interaction.followUp(`Looks like nobody got the answer this time. The answer: ${answer}`);
                        });
                });

                return
            }

        });

    }

}

module.exports = ModalSubmission