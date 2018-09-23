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
    if (command.name === undefined || command.name.trim() === '') {
      throw new Error(`Can't register command '${command.name}' : invalid name`)
    }

    if (this.commands.get(command.name) !== undefined) {
      throw new Error(`Can't register command '${command.name}' : already registered`)
    }

    if (command.handler === undefined && (command.subcommands === undefined || command.subcommands.length === 0)) {
      throw new Error(`Can't register command '${command.name}' : no handler`)
    }

    if (command.handler !== undefined) {
      command = _.defaults(command, {
        variableArgs: false,
        args: 0,
        params: '',
        desc: '*Aucune description disponible*'
      })

      this.commands.set(command.name, command)
    } else { // Generate a default handler for subcommands
      command = _.defaults(command, {
        variableArgs: true,
        args: 0,
        desc: '*Aucune description disponible*',
        params: '(' + command.subcommands.slice(1).reduce((l, v) => {
          return l + `|${v.name}`
        }, command.subcommands[0].name) + ') <...>'
      })

      let helpDesc = command.subcommands.reduce((l, v) => {
        return l + `!${command.name} ${v.name} ${v.params ? v.params : ''}\n`
      }, '')

      command.handler = async function (input) {
        if (input.args.length == 0) {
          return input.message.channel.send({
            "embed": {
              "title": `Liste des sous-commandes de ${command.name}`,
              "color": colors.default,
              "description": helpDesc
            }
          })
        }

        let matches = []
        for (let subcommand of command.subcommands) {
          if (subcommand.name.startsWith(input.args[0])) {
            if (subcommand.name === input.args[0]) {
                matches = [subcommand]
                break
            }
            matches.push(subcommand)
          }
        }

        if (matches.length === 0) {
          await input.message.channel.send(`Aucune sous-commande trouvée pour **${input.args[0]}**`)
        } else if (matches.length > 1) {
          await input.message.channel.send(`Plusieurs possibilitées pour **${input.args[0]}**, précisez`)
        } else {
          input.command = matches[0]
          input.args = input.args.slice(1)
          await matches[0].handler(input)
        }
      }

      this.commands.set(command.name, command)
    }
  }

  static splitCommand(text) {
    let regex = /"([\s\x21\x23-\xff]+)"|([\x21-\xff]+)/g
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

      let matches = []
      for (let command of Array.from(this.commands.values())) {
        if (command.name.startsWith(args[0])) {
          if (command.name === args[0]) {
              matches = [command]
              break
          }
          matches.push(command)
        }
      }

      if (matches.length === 0) {
        return msg.channel.send(`Aucune commande trouvée pour **${args[0]}**`)
      } else if (matches.length > 1) {
        return msg.channel.send(`Plusieurs possibilitées pour **${args[0]}**, précisez`)
      }

      let command = matches[0]
      args = args.slice(1)

      if (command) {
        if (command.variableArgs || command.args == args.length) {
          command.handler({
            command: command,
            message: msg,
            args: args,
            manager: this,
            emojis: Emoji,
            colors: colors
          })
          .catch(err => {
            //Raven.captureException(err)
            console.log(err)
            msg.channel.send(`${Emoji.get('boom')} Une erreur sauvage apparait. ${Emoji.get('boom')}\nSi le problème persiste, contactez un administrateur.`)
          })
        } else {
          msg.channel.send(`Mauvaise utilisation de **!${command.name}**.\nParamètres : *${command.params}*`)
        }
      } else {
        msg.channel.send(`Commande inconnue.`)
      }
    }
  }
}

module.exports = CommandManager