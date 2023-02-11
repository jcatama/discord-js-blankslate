const fs = require('node:fs');
const path = require('node:path');
const { Client,
    Collection,
    GatewayIntentBits,
    Partials
} = require('discord.js');
const commander = require('commander');
const { DB } = require('./classes/class-db.js');
const ModalSubmission = require('./classes/class-modal.js');
const Response = require('./classes/class-response.js');
const ProResponse = require('./classes/class-pro.js');

// Required commands args
commander
    .usage('[OPTIONS]...')
    .option('-p, --pro', 'To enable pro mode features.')
    .option('-g, --guild_id <value>', 'Guild ID.')
    .option('-t, --token <value>', 'Bot token.')
    .parse(process.argv);

const options = commander.opts();
const proMode = options.pro;
const guild_id = options.guild_id;
const token = options.token;

// Initialize server DB
const db = new DB(guild_id);

// Initialize Discord client
const client = new Client({
    intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
	],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);

    // If proMode is false, we don't initialize command file that includes 'pro-'
    // i.e  ./commands/pro-sample.js
    if (filePath.includes('pro-') && !proMode) continue

    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    // Sync DB
    db.initialize();

    // Inject dependencies
    new ModalSubmission(client, db);
    new Response(client);

    // Condition if you want to to have a exclusive feature
    if (proMode) {
        new ProResponse(client);
    }

    // Set bot status
    console.log('Running...');
});

// Catcher for all commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction, db);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command', ephemeral: true });
    }
});

client.login(token);
