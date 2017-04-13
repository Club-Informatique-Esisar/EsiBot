const CommandGroup = require('./CommandGroup.js');
const DB = require('./../DB.js');
const Mail = require('./../MailManager.js');
const Constants = require('./../Constants.js');
const Emojis = require('discord-emoji');

class CGValidation extends CommandGroup {
    constructor(manager) {
        super(manager);
        this.validating = new Map();

        manager.registerCommand('valider', this, this.comValidate, {
            argCount: 1, helper: "prenom.nom@etu.esisar.grenoble-inp.fr"
        });
    }

    static S6() {
        return Math.random().toString(36).substring(2, 8);
    }

    validateStep1(msg, args) {
        let pattern = /^[\w\-\.]+@etu\.esisar\.grenoble-inp\.fr$/i;
        if(!pattern.test(args[1])) {
            return msg.channel.sendMessage("Ce n'est pas un mail de l'Esisar ! Si tu n'y a plus accès, contacte un @admin !");
        }

        DB().collection('Students').findOne({ mail: args[1] }, function(err, student) {
            if(err) return console.log(err);
            if(student == null)
                return msg.channel.sendMessage("Mail inconnu au bataillon ! Si tu penses que c'est une erreur, contacte un @admin !");

            if(student.validated)
                return msg.channel.sendMessage("Ce mail a déjà été utilisé pour la validation d'un autre compte. Si c'est une erreur, contacte un @admin !");

            let vcode = CGValidation.S6();

            DB().collection('Validation').insertOne({ clientID: msg.author.id, code: vcode, mail: args[1] }, function(err, r) {
                if(err) return console.log(err);

                Mail().send({
                    text:    `Pour valider votre compte, il vous suffit d'entrer la commande suivante dans le channel bot-talk :\n!valider ${vcode}`,
                    from:    'Esibot <no-reply@esisariens.org>',
                    to:      `<${args[1]}>`,
                    subject: "Validation de votre compte Discord Esisariens"
                }, function(err, res) {
                    if(err) {
                        msg.channel.sendMessage("Erreur lors de l'envoi du mail, fait !valider annuler pour recommencer.");
                        return console.log(err);
                    }
                    msg.channel.sendMessage("Un mail t'a été envoyé avec le code de validation !");
                });
            });
        });
    }

    validateStep2(msg, args, client) {
        if(args[1] === "annuler") {
            DB().collection('Validation').deleteOne({ clientID: msg.author.id }, function(err, res) {
                    if(err) { return console.log(err) }
                    msg.channel.sendMessage("C'est tout bon, tu peux retenter à nouveau !");
                }
            );
            return;
        }

        if(client.code !== args[1]) {
            return msg.channel.sendMessage("Le code saisi est invalide.");
        }

        DB().collection('Students').find({ mail: client.mail }).next(function(err, student) {
            if(student === null) return console.log(`Le code est bon mais aucun étudiant trouvé avec ${client.mail}`);

            DB().collection('Validation').deleteOne({ clientID: msg.author.id }, function(err, r) {
                if(err) console.log("Error while deleting Validation line : " + err);
            });

            DB().collection('Students').updateOne({ mail: client.mail }, { $set: { clientID: msg.author.id, validated: true } }, function(err, r) {
                if(err) console.log("Error while updating client : " + err);
            });

            msg.member.addRoles([Constants.Roles[student.promo], Constants.Roles['Validé']]).then(member => {
                msg.channel.sendMessage(`Tu as correctement été ajouté au groupe ${student.promo} ${member.user.username} !`);
            }).catch(console.error);
        });
    }

    comValidate(msg, args) {
        let _this = this;
        if(msg.member.roles.has(Constants.Roles['Validé'])) {
            return msg.channel.sendMessage("Tu es déjà validé... Limiter ta consommation d'alcool tu devrais !");
        }

        DB().collection('Validation').find({ clientID: msg.author.id }).next(function(err, client) {
            if(err) return console.log(err);

            if(client === null) {
                _this.validateStep1(msg, args);
            } else {
                _this.validateStep2(msg, args, client);
            }
        });
    }
}

module.exports = CGValidation;