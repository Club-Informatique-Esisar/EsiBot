class GuildHelper {
  constructor() {
    this.guilds = {}
    this._esiguild = {
      instance: null,
      roles: null
    }
  }
  
  addGuild(guild) {
    this.guilds[guild[0]] = guild[1]

    // Direct reference storage for ESIGUILD
    if (guild[0] === process.env.ESIGUILD_ID) {
      this._esiguild.instance = guild[1]
      guild[1].roles.forEach(r => this._esiguild.roles[r.name] = r)
		}
  }
  
  get esiguild() {
    return this._esiguild.instance
  }
}

const instance = new GuildHelper()
module.exports = instance