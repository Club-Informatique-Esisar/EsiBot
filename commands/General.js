const CommandGroup = require('./CommandGroup.js');
const DB = require('./../DB.js');
const Constants = require('./../Constants.js');
const Emojis = require('discord-emoji');

class CGGeneral extends CommandGroup {
    constructor(manager) {
        super(manager);
        manager.registerCommand('aide', this, this.comHelp, {
            argCount: 1,
            helper: '<Commande>'
        });
    }

    comHelp(msg, args) {
        let command = this.manager.commands.get(args[1]);
        if(command && command.options && command.options.helper) {
            msg.channel.sendMessage(`Usage : !${args[1]} ${command.options.helper}`);
            return;
        }

        msg.channel.sendMessage(`Aucune aide disponible pour la commande '${args[1]}' ${Emojis.people.cry}`);
    }
}

module.exports = CGGeneral;