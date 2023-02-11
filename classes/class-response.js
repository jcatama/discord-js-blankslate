/**
 * @name Response
 * @description This class is responsible for handling basic responses
 */

const { chooseRandom } = require('./class-index.js');
const { gm, gn } = require('./../responses.json');

class Response {

    /**
     * @param {Client} client
     */
    constructor(client) {

        client.on('messageCreate', async (interaction) => {
            if (interaction.author.bot) return

            const content = interaction.content.toLowerCase()

            // GM
            if (content.includes('gm ') ||
                ['gm', 'good morning', 'good morning!'].includes(content)) {
                const emojis = chooseRandom(gm, 3)
                for (const emoji of emojis) {
                    await interaction.react(emoji)
                }
                return
            // GN
            } else if (content.includes('gn ') ||
                ['gn', 'good night', 'good night!'].includes(content)) {
                const emojis = chooseRandom(gn, 3)
                for (const emoji of emojis) {
                    await interaction.react(emoji)
                }
            // HBD
            } else if (content.includes('hbd') || content.includes('happy birthday')) {
                return await interaction.reply('Happy Birthday! 🎉🎂🎈')
            }
        });
    }

}

module.exports = Response