/**
 * @name: Utils
 * @description: This class is responsible for handling utility functions
 */

const {
    EmbedBuilder,
    Colors
} = require('discord.js');

/**
 * @param {Array} arr
 * @param {Number} num
 * @returns {Array}
 * @description: This function is responsible for choosing a random number of items from an array
 */
const chooseRandom = (arr, num) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}

/**
 * @param {DB} db
 * @returns {Void}
 * @description: This function is responsible for rendering active leaderbord
 */
const renderLeaderboard = async (db, interaction) => {

    let leaderboard = await db.Leaderboards.findOne({ where: { status: 1 } });
    if (!leaderboard) return true

    let embed = new EmbedBuilder()
            .setColor(Colors.Gold)
            .setTitle(leaderboard.title)
            // .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
            .setDescription(leaderboard.content)
            .setThumbnail(leaderboard.thumbnail)
            .setTimestamp();

    const points = await db.Points.findAll({
        where: {
            leaderboard_id: leaderboard.id
        },
        order: [
            ['points', 'DESC']
        ],
        limit: 25
    });

    let winner = null
    if (points) {
        let i = 0
        points.forEach(async (point) => {
            i++
            if (point.points >= leaderboard.target_points) {
                winner = point.username
            }
            embed.addFields({ name: `**${i}. ${point.username}**`, value: `\`${point.points}\`` , inline: false })
        });
    }

    const channel = await interaction.guild.channels.cache.find(c => c.id === leaderboard.channel_id);
    channel.messages.fetch(leaderboard.message_id).then(message => {
        if (winner) {
            leaderboard.status = 0
            leaderboard.save()
            embed.setDescription(`🎉 **Winner: ${winner} ** 🎉 \n\n`+leaderboard.content)
            embed.setFooter({ text: 'This event has ended.' });
        }
        message.edit({embeds: [embed]});
    }).catch(err => {
        console.error(err);
    });

    return winner
}

module.exports = {
    renderLeaderboard,
    chooseRandom
}
