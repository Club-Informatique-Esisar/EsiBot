const Axios = require('axios')

async function aideCommand({ message, manager, colors }) {
    let helpText = ""
    if (message.member.hasPermission("ADMINISTRATOR")) {
        helpText = Array.from(manager.commands.values()).reduce((l, v) => {
            return l + `${v.needAdmin ? "**(Admin)** " : ""}!${v.name} ${v.params}\n`
        }, '')
    } else {
        helpText = Array.from(manager.commands.values()).reduce((l, v) => {
            return l + (!v.needAdmin ? `!${v.name} ${v.params}\n` : "")
        }, '')
    }

    await message.channel.send({
        embed: {
            title: `**Liste des commandes**`,
            color: colors.default,
            description: `Utilisez !man <commande> pour afficher l'aide spécifique à une commande.\n\n` + helpText
        }
    })
}

async function manCommand({ message, args, manager, colors }) {
	let command = manager.commands.get(args[0])
	if (command) {
        let fields = [{
            "name": "Description",
            "value": command.desc
        }]

        if (command.params !== '') {
            fields.push({
                "name": "Paramètres",
                "value": command.params
            })
        }

        await message.channel.send({
            embed: {
                title: `**!${args[0]}**`,
                color: colors.default,
                fields: fields
            }
        })
	} else {
        await message.channel.send(`La commande **!${args[0]}** est inconnue.`)
    }
}

async function searchUserCommand({ message, args, colors, emojis }) {
    const status = await message.channel.send(`${emojis.get('arrows_counterclockwise')} Recherche en cours...`)
    let res = await Axios.post('/user/search', { query: args[0] })
    await status.edit({
        embed: {
            title: `**Résultat de la recherche pour "${args[0]}"**`,
            color: colors.default,
            description: res.data.reduce((desc, val) => {
                if(val.discord_id !== null)
                return `${desc}${val.first_name} ${val.last_name} (${val.promo}) <@${val.discord_id}>\n`
                else
                return `${desc}${val.first_name} ${val.last_name} (${val.promo})\n`
            }, '')
        }
    })
}

module.exports = function (cm) {
    cm.registerCommand({
        name: 'aide',
        handler: aideCommand,
        desc: "Affiche la liste des commandes disponibles.",
        esiguildOnly: false
    })

    cm.registerCommand({
        name: 'man',
        handler: manCommand,
        args: 1,
        params: '<commande>',
        desc: "Affiche les paramètres et la description d'une commande.",
        esiguildOnly: false
    })

    cm.registerCommand({
        name: 'cherche',
        handler: searchUserCommand,
        args: 1,
        params: '<requête>',
        desc: "Recherche une personne dans la base d'EsiAuth.",
        esiguildOnly: false,
        needAdmin: true
    })
}