let _ = require('lodash')

class CommandManager {
	constructor(delimiter) {
    this.config = require('./Config')
    this.delimiter = delimiter
		this.commands = new Map()
	}

	registerCommand(name, handler, opts) {
    if (name === undefined || name.trim() === '' || handler === undefined) {
      return console.error(`Failed to load command : '${name}'`)
    }

    opts = _.defaults(opts, {
      variableArgs: false,
      args: 0,
      params: '',
      desc: ''
    })

		this.commands.set(name, {
			handler: handler,
			options: opts
		})
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
				return;

			let args = CommandManager.splitCommand(text)
			args[0] = args[0].toLowerCase()
			let command = this.commands.get(args[0])

			if (command) {
				if (command.options.variableArgs || command.options.args == args.length - 1) {
					command.handler(msg, args, this).catch(console.err)
				} else {
          msg.channel.send(`Mauvaise utilisation de **!${args[0]}**.\nParamètres : *${command.options.params}*`)
        }
			} else {
        msg.channel.send(`Commande inconnue.`)
      }
		}
	}
}

let cm = new CommandManager("!")

let commandsFolder = require("path").join(__dirname, "commands")
require("fs").readdirSync(commandsFolder).forEach(function(file) {
	require("./commands/" + file)(cm)
	console.log(`[ComGroup] Loaded : '${file.substr(0, file.length-3)}'`)
})

module.exports = cm