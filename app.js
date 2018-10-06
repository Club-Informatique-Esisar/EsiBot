require('dotenv').config()
const Raven = require('raven')
//Raven.config('https://cc44c59ee43f4cb98184524f3406f750:3f7b9d8a03a64e56b2367f05ab7d8c1a@sentry.io/238392').install()

const Axios = require('axios')
const Discord = require('discord.js')
const client = new Discord.Client()

// Config Axios defaults
Axios.defaults.baseURL = process.env.API_URL
Axios.defaults.headers.common['Authorization'] = 'Bearer ' + process.env.API_KEY

// Setup our own CommandManager
const guildHelper = require('./GuildHelper.js')
const commandManager = new (require('./CommandManager.js'))("!", guildHelper)

// Setup Discord Client events
client.on('ready', () => {
  client.guilds.forEach((guild, id) => guildHelper.addGuild(guild, id))
  console.log(`[Success] Logged in as ${client.user.username} and ready to comply!`)
})
client.on('message', commandManager.getListener())
client.on('error', console.error)
client.login(process.env.DISCORD_KEY)