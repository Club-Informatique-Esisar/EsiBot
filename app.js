require('dotenv').config()
const Raven = require('raven')
//Raven.config('https://cc44c59ee43f4cb98184524f3406f750:3f7b9d8a03a64e56b2367f05ab7d8c1a@sentry.io/238392').install()

const Axios = require('axios')
const Emojis = require('node-emoji')
const Discord = require('discord.js')
const client = new Discord.Client()

/*Axios.defaults.baseURL = config.api.endpoint
Axios.post('/login', { login: config.api.user, password: config.api.pass })
.then(res => {
  config.api.refreshToken = res.data.refreshToken
  config.api.accessToken = res.data.accessToken
  config.api.expTime = JSON.parse(Buffer.from(res.data.accessToken.split('.')[1], 'base64')).exp
})
.catch(console.error)

Axios.interceptors.request.use(req => {
  if (req.url === Axios.defaults.baseURL + '/getAccessToken') return req
  if (config.api.expTime > Math.floor(Date.now() / 1000)) {
    req.headers.Authorization = 'Bearer ' + config.api.accessToken
    return req
  }

  Axios.post('/getAccessToken', {
    token: store.state.refreshToken
  })
  .then(res => {
    if (res.data.error) {
      console.error(res.data.error)
    } else {
      config.api.accessToken = res.data.accessToken
      req.headers.Authorization = 'Bearer ' + store.state.accessToken
      return req
    }
  })
  .catch(console.error)
}, console.error)*/

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