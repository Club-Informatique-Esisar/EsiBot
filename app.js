require('dotenv').config()

const Axios = require('axios')
const Discord = require('discord.js')
const client = new Discord.Client({
	intents: [
		Discord.Intents.FLAGS.GUILDS,
		Discord.Intents.FLAGS.GUILD_MESSAGES,
	]
})

// Config Axios defaults
Axios.defaults.baseURL = process.env.API_URL
Axios.defaults.headers.common['Authorization'] = 'Bearer ' + process.env.API_KEY

// Setup our own CommandManager
const guildHelper = require('./GuildHelper.js')
const commandManager = new (require('./CommandManager.js'))(client, process.env.COMMAND_DELIMITER, guildHelper)

// Setup Discord Client events
client.once('ready', async () =>
{
	const guilds = await client.guilds.fetch()
	for (const [id, guild] of guilds)
	{
		const realGuild = await guild.fetch()
		await guildHelper.addGuild(id, realGuild)
	}
	console.log(`[Success] Logged in as ${client.user.username} and ready to comply!`)
})

client.on('messageCreate', commandManager.getListener())
client.on('error', console.error)

client.login(process.env.DISCORD_KEY)