/**
 * @name ProResponse
 * @description This class is responsible for handling pro exclusive responses
 */

class ProResponse {

    /**
     * @param {Client} client
     */
    constructor(client) {

        client.on('messageCreate', async (interaction) => {
            if (interaction.author.bot) return

            const content = interaction.content.toLowerCase()

            // Hello
            if (content.includes('hello')) {
                return await interaction.reply(`Hi! ${interaction.author.username}`)
            }
        });
    }

}

module.exports = ProResponse