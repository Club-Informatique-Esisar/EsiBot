const Emoji = require('node-emoji')
const _ = require('lodash')
const fs = require("fs")
const colors = require("./colors.js")
const path = require("path")

class CommandManager {
    constructor(client, delimiter, guildHelper) {
        this.client = client
        this.guildHelper = guildHelper
        this.delimiter = delimiter
        this.commands = new Map()
        
        let commandsFolder = path.join(__dirname, "commands")
        fs
        .readdirSync(commandsFolder)
        .forEach(file => {
            if (!file.endsWith(".js"))
                return

            require(`./commands/${file}`)(this)
            console.log(`[CM] Loaded Command Group : '${file.substr(0, file.length - 3)}'`)
        })
    }

    static setDefaultCommandParams(command) {
        let defaultParamText = ""
        if (command.subcommands != undefined) {
            defaultParamText = '('
                + command.subcommands.slice(1).reduce((l, v) => l + `|${v.name}`, command.subcommands[0].name)
                + ') <...>';
        }

        return _.defaults(command, {
            variableArgs: false,
            args: 0,
            desc: '*Aucune description disponible*',
            params: defaultParamText,
            esiguildOnly: true,
            needAdmin: false
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
            command = CommandManager.setDefaultCommandParams(command)
            this.commands.set(command.name, command)
        } else if (command.subcommands !== undefined) { // Generate a default handler for subcommands    
            command = CommandManager.setDefaultCommandParams(command)

            for (let i = 0; i < command.subcommands.length; i++) {
                command.subcommands[i] = CommandManager.setDefaultCommandParams(command.subcommands[i])
            }

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
                    let canExecute = CommandManager.canExecuteCommand(matches[0], input.message)
                    if (canExecute !== true) {
                        return input.message.channel.send(canExecute)
                    }

                    let subcommand = matches[0]
                    input.command = subcommand
                    input.args = input.args.slice(1)

                    if (subcommand.variableArgs || subcommand.args == input.args.length) {
                        await subcommand.handler(input)
                    } else {
                        await input.message.channel.send(`Mauvaise utilisation de **!${command.name} ${subcommand.name}**.\nParamètres : *${subcommand.params}*`)
                    }
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

    static canExecuteCommand(command, msg) {
        if (command.esiguildOnly && msg.guild.id !== process.env.ESIGUILD_ID) {
            return `La commande **${command.name}** n'est utilisable que sur le Discord Esisariens`
        }

        if (command.needAdmin && !msg.member.hasPermission("ADMINISTRATOR")) {
            return `La commande **${command.name}** n'est utilisable que par un admin`
        }

        return true
    }

    getListener() {
        return msg => {
            if (msg.author.bot
                || msg.channel.type === "dm"
                || !msg.content.startsWith(this.delimiter))
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
                let canExecute = CommandManager.canExecuteCommand(command, msg)
                if (canExecute !== true) {
                    return msg.channel.send(canExecute)
                }

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
                        if (err.response) {
                            console.error(err.response.data)
                        } else {
                            console.error(err)
                        }
                        
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