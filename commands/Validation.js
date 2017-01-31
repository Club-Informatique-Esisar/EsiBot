const CommandGroup = require('./CommandGroup.js');
const DB = require('./../DB.js');
const Constants = require('./../Constants.js');
const Emojis = require('discord-emoji');

class CGValidation extends CommandGroup {
    constructor(manager) {
        super(manager);
        this.validating = new Map();

        manager.registerCommand('valider', this, this.comValidate, {
            helper: '<Prénom> <Nom>'
        });
    }

    comValidate(msg, args) {
        let client = this.validating.get(msg.author.username);
        if(client === undefined) {
            this.validating.set(msg.author.username, { step: "VERIF_MAIL", name: args[1], lastName: args[2] });
            msg.channel.sendMessage(`Cette adresse est-elle valide ? ${args[1]}.${args[2]}@etu.esisar.grenoble-inp.fr`
                + '\nUtilisez !valider oui ou !valider non pour répondre.');
        } else {
            switch(client.step) {
                case "VERIF_MAIL":
                    if(args[1].toLowerCase() === "oui") {
                        msg.channel.sendMessage(`Bon faut envoyer le mail après avoir généré le code`);
                        client.step = "MAIL_OK";
                    } else {
                        msg.channel.sendMessage('Merci de contacter un administrateur pour réaliser une validation manuelle.');
                        this.validating.delete(msg.author.username);
                    }
                    break;
                case "MAIL_OK":
                    let cursor = DB().collection('Students').find({name: client.name, lastName: client.lastName });

                    cursor.count().then(function(count) {
                        if(count != 1) return null;
                        return cursor.next().then((student) => student);
                    }).then(function(val) {
                        if(val === null)
                            return msg.channel.sendMessage(`Personne trouvé avec ce nom. Vérifie si tu n'as pas fait de faute !`);

                        msg.member.addRoles([Constants.Roles[val.promo], Constants.Roles['Validé']]).then(() => {
                            msg.channel.sendMessage(`Bienvenue dans le groupe <${val.promo}> ${msg.author.username} !`)
                        });
                    }).catch(console.error);
                    this.validating.delete(msg.author.username);
                    break;
            }
        }
    }
}

module.exports = CGValidation;