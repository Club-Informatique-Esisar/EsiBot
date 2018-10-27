const Axios = require('axios')

async function fixValideCommand({ message }) {
  message.guild.members.forEach(async member => {
    if(member.roles.some(r => ["P2017", "P2018", "P2019", "P2020", "P2021", "P2022", "P2023"].includes(r.name)) && !member.roles.has("505803903468830735")) {
      try {
        await member.addRole("505803903468830735")
      } catch(e) {
        return
      }
    }
  })
}

module.exports = function (cm) {
  cm.registerCommand({
    name: 'fixValide',
    desc: 'Remet le rôle Validé à ceux qui ont un rôle correspondant à une promotion',
    handler: fixValideCommand
  })
}