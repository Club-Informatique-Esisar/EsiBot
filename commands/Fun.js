const CommandGroup = require('./CommandGroup.js');
const Emojis = require('discord-emoji');

class CGFun extends CommandGroup {
    constructor(manager) {
        super(manager);
        manager.registerCommand('scramble', this, this.comScramble, {
            argCount: 0, helper: ''
        });
        manager.registerCommand('clearnames', this, this.comClearNames, {
            argCount: 0, helper: ''
        });
    }

    comScramble(msg, args) {
        let members = Constants.EsiGuild.members;
        let ids = members.keyArray().slice();
        CGFun.shuffle(ids);

        let i = 0;
        for(let id of members.keyArray()) {
            if(members.get(id).user.username === "NoNiMad") continue;

            console.log(`${members.get(id).user.username} (${id}) => ${members.get(ids[i]).user.username} (${ids[i]})`);
            members.get(id).setNickname(members.get(ids[i]).user.username).catch(console.error);
            i++;
        }
    }

    comClearNames(msg, args) {
        let members = Constants.EsiGuild.members;
        for(let id of members.keyArray()) {
            if(members.get(id).user.username === "NoNiMad") continue;
            members.get(id).setNickname("").catch(console.error);
        }
    }

    static shuffle(a) {
        for (let i = a.length; i; i--) {
            let j = Math.floor(Math.random() * i);
            [a[i - 1], a[j]] = [a[j], a[i - 1]];
        }
    }
}

module.exports = CGFun;