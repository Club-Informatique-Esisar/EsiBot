const Emoji = require('node-emoji')
const _ = require('lodash')
const fs = require("fs")
const colors = require("./colors.js")

class CommandManager {
	constructor(delimiter, guildHelper) {
    this.guildHelper = guildHelper
    this.delimiter = delimiter
    this.commands = new Map()
    
    let commandsFolder = require("path").join(__dirname, "commands")
    fs.readdirSync(commandsFolder).forEach(file => {
      require("./commands/" + file)(this)
      console.log(`[CM] Loaded Command Group : '${file.substr(0, file.length - 3)}'`)
    })
	}

	registerCommand(command) {
    if (command.name === undefined || command.name.trim() === '' || command.handler === undefined) {
      throw new Error(`Failed to load command : '${command.name}'`)
    }

    command = _.defaults(command, {
      variableArgs: false,
      args: 0,
      params: '',
      desc: '*Aucune description disponible*'
    })

		this.commands.set(command.name, command)
	}

	static splitCommand(text) {
		let regex = /'([\s\x21-\xff]+)'|"([\s\x21-\xff]+)"|([\x21-\xff]+)/g
		let res = []
		let m = null

		while ((m = regex.exec(text)) != null) {
			res.push(m[1] || m[2] || m[3])
		}

		return res
	}

	getListener() {
		return msg => {
			if (msg.author.bot ||
        msg.channel.type === "dm" ||
        !msg.content.startsWith(this.delimiter))
        return

			let text = msg.content.substr(1)
			if (text.length == 0)
				return

			let args = CommandManager.splitCommand(text)
			args[0] = args[0].toLowerCase()
			let command = this.commands.get(args[0])

			if (command) {
				if (command.variableArgs || command.args == args.length - 1) {
          command.handler({
            msg: msg,
            args: args,
            cm: this,
            emojis: Emoji,
            colors: colors
          })
          .catch(err => {
            console.log(err)
            msg.channel.send(`${Emoji.get('boom')} Une erreur sauvage apparait. ${Emoji.get('boom')}\nSi le problème persiste, contactez un administrateur.`)
          })
				} else {
          msg.channel.send(`Mauvaise utilisation de **!${args[0]}**.\nParamètres : *${command.params}*`)
        }
			} else {
        msg.channel.send(`Commande inconnue.`)
      }
		}
	}
}

module.exports = CommandManager