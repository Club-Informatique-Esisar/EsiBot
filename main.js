let Config = require('./Config.js')
let Axios = require('axios')
const Emojis = require('node-emoji')
const Discord = require('discord.js')
const client = new Discord.Client()

Axios.defaults.baseURL = "http://localhost:1337"

client.on('ready', () => {
	console.log(`Successfully logged in as ${client.user.username}!`)
	for (let g of client.guilds) {
		if (g[0] === Config.EsiGuildID) {
			Config.EsiGuild = g[1]
		}
	}

	Config.EsiGuild.roles.forEach(r => Config.Roles[r.name] = r.id)
})

let commandManager = require('./CommandManager')
client.on('message', commandManager.getListener())

client.login('MjcyNTA5ODExNTQ1ODY2MjQw.C5X7wQ.CVQPQ3UYSuSMUCdfvB4MeWbdcVk')