let Emojis = require('node-emoji')
let Axios = require('axios')

async function validateCommand(msg, args, cm) {
  await msg.delete()
  let status = await msg.channel.send(`${Emojis.get('arrows_counterclockwise')} Validation en cours...`)
  if (msg.member.roles.has(cm.config.Roles['Validé'])) {
    status.edit(`${Emojis.get('no_entry_sign')} Ton compte est déjà validé`)
  } else {
    let res = await Axios.post('/login', { login: args[1], password: args[2] })
    let data = res.data
    if (data.error) {
      status.edit(`${Emojis.get('no_entry_sign')} ${data.error}`)
      return
    } else {
      let instance = Axios.create({
        headers: { 'Authorization': `Bearer ${data.accessToken}` }
      });

      status.edit(`${Emojis.get('white_check_mark')} Connection réussie\n`)

      if (data.user.promo === null) {
        status.edit(`${Emojis.get('no_entry_sign')} Aucune promo trouvée`)
        return
      }

      let promoRes = await instance.get(`/promo/${data.user.promo}`)
      status.edit(`${Emojis.get('white_check_mark')} Votre promotion : ${promoRes.data.name}`)
    }
  }
}

module.exports = function(cm) {
  cm.registerCommand('valider', validateCommand, {
    args: 2,
    params: '<pseudo> <mot de passe>',
    desc: 'Permet de lier un compte EsiAuth à un compte Discord. Nécessite que le compte Discord soit renseigné sur le compte EsiAuth.'
  })
}