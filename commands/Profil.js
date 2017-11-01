function psetCommand(msg, args) {
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

function profilCommand(msg, args) {
  return msg.channel.send("En travaux.")

  let user = msg.mentions.users.array()[0]
  if (user === undefined)
  	return msg.channel.send("Il faut mentionner l'utilisateur en précédant son pseudo par un @ !")

  if (!Config.EsiGuild.member(user).roles.has(Config.Roles['Validé']))
  	return msg.channel.send("La personne n'est pas validée.")

  DB().collection('Students').find({ clientID: user.id }).next(function(err, student) {
      if(err) return console.log(err)
      if(student === null) return console.log("Personne non validée dans la BDD a le rôle 'Validé' !")

      let profileText = `**${user.username}** s'apelle `

      if(student.name) {
          profileText += `**${student.name}**`
      } else {
          let noms = student.mail.split('@')[0].split('.')
          noms.forEach((n, i, t) => t[i] = n.charAt(0).toUpperCase() + n.slice(1))
          profileText += `**${noms[0]} ${noms[1]}**`
      }
      profileText += ` et est en **${student.promo}** !\n`

      if(student.games) {
          profileText += "\n\n__**Jeux :**__"
          if(student.games.steam)
              profileText += `\n*Steam* : ${student.games.steam}`
          if(student.games.battlenet)
              profileText += `\n*Battle.net* : ${student.games.battlenet}`
          if(student.games.lol)
              profileText += `\n*League of Legends* : ${student.games.lol}`
          if(student.games.minecraft)
              profileText += `\n*Minecraft* : ${student.games.minecraft}`
      }

      msg.channel.send(profileText)
  })
}

module.exports = function (cm) {
  cm.registerCommand('profil', profilCommand, {
    argCount: 1,
    helper: '@pseudo'
  })

  cm.registerCommand('pset', psetCommand, {
    helper: '(nom|steam|battlenet|lol|minecraft) "valeur"'
  })
}