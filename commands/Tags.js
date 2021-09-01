const Axios = require('axios')

async function isRealTag(tag)
{
	return (await Axios.get('/discord/tags')).data.map(t => t.name).includes(tag)
}

async function listCommand({ message, emojis, colors })
{
	const status = await message.channel.send(`${emojis.get('arrows_counterclockwise')} Requête en cours...`)
	let tags = (await Axios.get('/discord/tags')).data.map(t => t.name)

	for (let tag of tags)
	{
		if (message.guild.roles.cache.find(role => role.name === tag) === undefined)
		{
			await message.guild.roles.create({
				name: tag,
				color: colors.tags,
				hoist: false,
				mentionable: true,
				permissions: 0n
			})
		}
	}

	await status.edit({
		embeds: [{
			title: `**Liste des tags disponibles**`,
			color: colors.default,
			description: tags.reduce((desc, val) =>
			{
				return `${desc}${val}\n`
			}, '')
		}]
	})
}

async function joinCommand({ message, args })
{
	if (!(await isRealTag(args[0])))
	{
		await message.reply(`bien tenté mais **${args[0]}** est un groupe, pas un tag.`)
		return
	}

	let role = message.guild.roles.cache.find(role => role.name === args[0])
	if (role !== null)
	{
		if (message.member.roles.cache.find(role => role.name === args[0]))
		{
			await message.reply(`tu as déjà le tag **${args[0]}**.`)
		}
		else
		{
			await message.member.roles.add(role)
			await message.reply(`le tag **${args[0]}** t'as correctement été ajouté !`)
		}
	}
	else
	{
		await message.reply(`le tag **${args[0]}** n'existe pas ! Utilise **!tags list** pour consulter la liste des tags disponibles.`)
	}
}

async function quitCommand({ message, args })
{
	if (!(await isRealTag(args[0])))
	{
		await message.reply(`bien tenté mais **${args[0]}** est un groupe, pas un tag.`)
		return
	}

	let role = message.member.roles.cache.find(role => role.name === args[0])
	if (role !== null)
	{
		await message.member.roles.remove(role)
		await message.reply(`le tag **${args[0]}** t'as correctement été retiré !`)
	}
	else
	{
		await message.reply(`impossible de te retirer le tag **${args[0]}**, tu ne l'as pas !`)
	}
}

module.exports = function (cm)
{
	cm.registerCommand({
		name: 'tags',
		desc: 'Les tags permettent de n\'obtenir que les news qui vous intéressent !',
		variableArgs: true,
		subcommands: [
			{
				name: 'list',
				handler: listCommand,
				desc: `Liste les tags disponibles`
			},
			{
				name: 'join',
				handler: joinCommand,
				desc: `Vous ajoute au tag demandé. NE PAS MENTIONNER LE RÔLE (PAS DE @)`,
				args: 1,
				params: '<nom du tag>'
			},
			{
				name: 'quit',
				handler: quitCommand,
				desc: `Vous retire le tag demandé. NE PAS MENTIONNER LE RÔLE (PAS DE @)`,
				args: 1,
				params: '<nom du tag>'
			}
		]
	})
}