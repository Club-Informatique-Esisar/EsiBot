const Axios = require('axios')

async function validateCommand({ message, args, manager, emojis }) {
  const status = await message.channel.send(`${emojis.get('arrows_counterclockwise')} Demande de validation prise en compte...`)

  try {
    // If it's an email
    if (args[0].indexOf('@') > -1) {
      await Axios.post('/user/discord/send', { discord_id: message.author.id, mail: args[0] })
      await status.edit(`${emojis.get('white_check_mark')} Un mail avec le code de validation vous a été envoyé ! Utilisez !valider <code> pour terminer le processus.`)
    } else {
      let res = await Axios.post('/user/discord/link', { discord_id: message.author.id, token: args[0] })
      let promo = res.data.split('-')[0]
      await status.edit(`${emojis.get('arrows_counterclockwise')} Token valide, votre promotion : **${promo}**`)
      await message.member.setRoles([manager.guildHelper.esiroleID(promo), manager.guildHelper.esiroleID('Validé')])
      await status.edit(`${emojis.get('white_check_mark')} Validation réussie !`)
    }    
  } catch (err) {
    if (err.response) {
      const e = emojis.get('no_entry_sign')
      switch (err.response.data.error) {
        case "NO_ACCOUNT_ESISAR":
          await status.edit(`${e} Tu es un(e) Esisarien(ne) sans compte EsiAuth, ce n'est pas normal ! Contacte un admin.`)// Contactons un <@&${manager.guildHelper.esiroleID('admin')}>.`)
          break;
        case "NO_ACCOUNT":
          await status.edit(`${e} Aucun compte trouvé. Tu peux en créer un en tant qu'externe sur https://esiauth.esisariens.org.`)
          break;
        case "TOKEN_EXISTS":
          await status.edit(`${e} Une procédure de validation est déjà en cours pour ce mail.`)
          break;
        case "ALREADY_LINKED":
          await status.edit(`${e} Cette adresse mail possède déjà un compte Discord lié.`)
          break;
        case "NO_TOKEN":
          await status.edit(`${e} Ce code ne correspond à aucune validation en cours.`)
          break;
      }
    } else {
      throw err
    }
  }
}

module.exports = function(cm) {
  cm.registerCommand({
    args: 1,
    name: 'valider',
    handler: validateCommand,
    params: '<mail>',
    desc: 'Permet de lier un compte EsiAuth à un compte Discord. Nécessite que le compte Discord soit renseigné sur le compte EsiAuth.'
  })
}