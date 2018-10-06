let Axios = require('axios')

async function psetCommand(msg, args) {
  return msg.channel.send("En travaux.");

  if (args.length < 2)
  	return msg.channel.send("Pas assez d'arguments... Voire l'aide pour plus d'infos.");

  switch (args[1].toLowerCase()) {
  	case "nom":
  	case "steam":
  	case "battlenet":
  	case "lol":
  	case "minecraft":
  	default:
  		return msg.channel.send(`${args[1]} : Pas encore implémenté...`)
  }
}

async function profilCommand(msg, args, cm) {
  let mentions = msg.mentions.members
  if (mentions.size === 0) {
    return msg.channel.send(`Il faut utiliser une mention !`)
  }

  let user = mentions.first()
  let res = await Axios.post('/user/search', { search: { discordID: user.id } })
  if (res.data.length !== 1) {
    return msg.channel.send('Aucun résultat.')
  }

  let esiUser = res.data[0]
  let fields = []

  if (esiUser.firstName !== '' || esiUser.lastName !== '') {
    fields.push({
      name: 'Nom',
      value: `${esiUser.firstName} ${esiUser.lastName}`
    })
  }

  if (!esiUser.extern) {
    fields.push({
      name: 'Promo',
      value: esiUser.promo.name
    })
  }

  if (esiUser.clubs.length > 0) {
    fields.push({
      name: 'Clubs',
      value: esiUser.clubs.reduce((l, v) => l + ' ' + v.name, '')
    })
  }

  msg.channel.send({
    "embed": {
      "description": `Profil de **${user.user.username}**`,
      "color": cm.config.embedColor,
      "fields": fields
    }
  })
}

module.exports = function (cm) {
  /*cm.registerCommand({
    name: 'profil',
    handler: profilCommand,
    args: 1,
    params: '@pseudo'
  })

  cm.registerCommand({
    name: 'pset',
    handler: psetCommand,
    params: '(nom|steam|battlenet|lol|minecraft) <valeur>'
  })*/
}