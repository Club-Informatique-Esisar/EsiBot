let Emojis = require('node-emoji')
let Axios = require('axios')

async function validateCommand(msg, args, cm) {
  await msg.delete()

  let status = await msg.channel.send(`${Emojis.get('arrows_counterclockwise')} Validation en cours...`)
  if (msg.member.roles.has(cm.config.roles['Validé'])) {
    return status.edit(`${Emojis.get('no_entry_sign')} Ton compte est déjà validé`)
  }

  let res = await Axios.post('/login', { login: args[1], password: args[2] })
  if (res.data.error !== undefined) {
    return status.edit(`${Emojis.get('no_entry_sign')} ${res.data.error}`)
  }

  let instance = Axios.create({
    headers: { 'Authorization': `Bearer ${res.data.accessToken}` }
  })

  status.edit(`${Emojis.get('white_check_mark')} Connection réussie\n`)

  if (res.data.user.promo === null) {
    return status.edit(`${Emojis.get('no_entry_sign')} Aucune promo trouvée`)
  }

  let promoRes = await instance.get(`/promo/${res.data.user.promo}`)
  status.edit(`${Emojis.get('white_check_mark')} Votre promotion : ${promoRes.data.name}`)

  let linkRes = await instance.post('/user/linkDiscord', { discordID: msg.author.id })
  if (linkRes.data.error !== undefined) {
    return status.edit(`${Emojis.get('no_entry_sign')} ${linkRes.data.error}`)
  }

  await msg.member.addRoles([ cm.config.roles[promoRes.data.name], cm.config.roles['Validé'] ])
  status.edit(`${Emojis.get('white_check_mark')} Validation réussie !`)
}

module.exports = function(cm) {
  cm.registerCommand({
    name: 'valider',
    handler: validateCommand,
    args: 2,
    params: '<pseudo> <mot de passe>',
    desc: 'Permet de lier un compte EsiAuth à un compte Discord. Nécessite que le compte Discord soit renseigné sur le compte EsiAuth.'
  })
}