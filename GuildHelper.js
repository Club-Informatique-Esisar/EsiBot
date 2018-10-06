class GuildHelper {
  constructor() {
    this.guilds = {}
    this._esiguild = {
      instance: null,
      roles: {}
    }
  }
  
  addGuild(guild, id) {
    console.log(`[Guild] Joined ${guild} (ID: ${id})`)
    this.guilds[id] = guild

    // Direct reference storage for ESIGUILD
    if (id === process.env.ESIGUILD_ID) {
      this._esiguild.instance = guild
      guild.roles.forEach((role, id) => {
        this._esiguild.roles[role.name] = role
      })

      console.log(`[EsiGuild] Roles: ${guild.roles.map(v => v.name).join(", ")}`)
      console.log(`[EsiGuild] Emojis: ${guild.emojis.map(v => v.name).join(", ")}`)
		}
  }
  
  get esiguild() {
    return this._esiguild.instance
  }

  esiroleID(name) {
    return this._esiguild.roles[name].id
  }
}

const instance = new GuildHelper()
module.exports = instance