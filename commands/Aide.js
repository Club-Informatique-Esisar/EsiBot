const Axios = require('axios')

async function aideCommand({ msg, cm, colors }) {
  await msg.channel.send({
    embed: {
      title: `**Liste des commandes**`,
      color: colors.default,
      description:
        `Utilisez !man <commande> pour afficher l'aide spécifique à une commande.\n\n` +
        Array.from(cm.commands.values()).reduce((l, v) => {
          return l + `!${v.name} ${v.params}\n`
        }, '')
    }
  })
}

async function manCommand({ msg, args, cm, colors }) {
	let command = cm.commands.get(args[1])
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

    await msg.channel.send({
      embed: {
        title: `**!${args[1]}**`,
        color: colors.default,
        fields: fields
      }
    })
	} else {
    await msg.channel.send(`La commande **!${args[1]}** est inconnue.`)
  }
}

async function listUsersCommand({ msg }) {
  const response = await Axios.get('/user')
  let liste = ''
  response.data.forEach(user => {
    liste += `- ${user.username}\n`
  });
  await msg.channel.send('**Liste des utilisateurs :**\n' + liste)
}

module.exports = function (cm) {
  cm.registerCommand({
    name: 'aide',
    handler: aideCommand,
    desc: "Affiche la liste des commandes disponibles."
  })

  cm.registerCommand({
    name: 'man',
    handler: manCommand,
    args: 1,
    params: '<commande>',
    desc: "Affiche les paramètres et la description d'une commande."
  })

  cm.registerCommand({
    name: 'listusers',
    handler: listUsersCommand,
    desc: "Liste les utilisateurs renvoyés par l'API d'EsiAuth."
  })
}