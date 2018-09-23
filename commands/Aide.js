const Axios = require('axios')

async function aideCommand({ message, manager, colors }) {
  await message.channel.send({
    embed: {
      title: `**Liste des commandes**`,
      color: colors.default,
      description:
        `Utilisez !man <commande> pour afficher l'aide spécifique à une commande.\n\n` +
        Array.from(manager.commands.values()).reduce((l, v) => {
          return l + `!${v.name} ${v.params}\n`
        }, '')
    }
  })
}

async function manCommand({ message, args, manager, colors }) {
	let command = manager.commands.get(args[1])
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
        title: `**!${args[1]}**`,
        color: colors.default,
        fields: fields
      }
    })
	} else {
    await message.channel.send(`La commande **!${args[1]}** est inconnue.`)
  }
}

async function listUsersCommand({ message }) {
  const response = await Axios.get('/user')
  let liste = ''
  response.data.forEach(user => {
    liste += `- ${user.username}\n`
  });
  await message.channel.send('**Liste des utilisateurs :**\n' + liste)
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