async function fixValideCommand({ message })
{
	message.guild.members.forEach(async member =>
	{
		if (member.roles.cache.some(r => ["P2017", "P2018", "P2019", "P2020", "P2021", "P2022", "P2023"].includes(r.name)) && !member.roles.cache.has("505803903468830735"))
		{
			try
			{
				await member.roles.add("505803903468830735")
			}
			catch (e)
			{
				return
			}
		}
	})
}

async function purgeCommand({ message, args })
{
	const n = Math.min(Math.max(+args[0], 0), 20)
	message.channel.bulkDelete(n)
}

module.exports = function (cm)
{
	cm.registerCommand({
		name: 'fixValide',
		desc: 'Remet le rôle Validé à ceux qui ont un rôle correspondant à une promotion',
		handler: fixValideCommand,
		needAdmin: true
	})

	cm.registerCommand({
		name: "purge",
		desc: "Supprime les n derniers messages",
		handler: purgeCommand,
		args: 1,
		params: '<n>',
		needAdmin: true
	})
}