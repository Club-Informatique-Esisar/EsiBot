let Raven = require('raven')
//Raven.config('https://cc44c59ee43f4cb98184524f3406f750:3f7b9d8a03a64e56b2367f05ab7d8c1a@sentry.io/238392').install()

let Axios = require('axios')
const Emojis = require('node-emoji')
const Discord = require('discord.js')
const client = new Discord.Client()

let config = require('./Config.js')

Axios.defaults.baseURL = config.api.endpoint
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
}, console.error)

client.on('ready', () => {
	console.log(`Successfully logged in as ${client.user.username}!`)
	for (let g of client.guilds) {
		if (g[0] === config.guildID) {
			config.guild = g[1]
		}
	}

	config.guild.roles.forEach(r => config.roles[r.name] = r)
})

let commandManager = require('./CommandManager')
client.on('message', commandManager.getListener())

client.login(config.secret)