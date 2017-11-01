async function helpCommand(msg, args, cm) {
	let command = cm.commands.get(args[1])
	if (command) {
		/*msg.channel.send(`**!${args[1]}**
\`\`\`
Paramètres  : ${command.options.params}
Description : ${command.options.desc}
\`\`\``)*/
    msg.channel.send({
      "embed": {
        "title": `**!${args[1]}**`,
        "color": 0xa70096,
        "fields": [
          {
            "name": "Description",
            "value": command.options.desc
          },
          {
            "name": "Paramètres",
            "value": command.options.params
          }
        ]
      }
    })
	} else {
    msg.channel.send(`La commande **!${args[1]}** est inconnue.`)
  }
}

module.exports = function (cm) {
  cm.registerCommand('man', helpCommand, {
    args: 1,
    params: '<commande>',
    desc: "Affiche les paramètres et la description d'une commande donnée."
  })
}