const CommandGroup = require('./CommandGroup.js');
const DB = require('./../DB.js');
const Config = require('./../Config.js');
const Emojis = require('discord-emoji');

class CGProfil extends CommandGroup {
    constructor(manager) {
        super(manager);

        manager.registerCommand('profil', this, this.comProfil, {
            argCount: 1, helper: '@pseudo'
        });

        manager.registerCommand('pset', this, this.comPSet, {
            helper: '(nom|steam|battlenet|lol|minecraft) "valeur"'
        });
    }

    comPSet(msg, args) {
        if(args.length < 2)
            return msg.channel.sendMessage("Pas assez d'arguments... Voire l'aide pour plus d'infos.");

        switch(args[1].toLowerCase()) {
            case "nom":
                DB().collection('Students').updateOne({ clientID: msg.author.id, validated: true }, { $set: { name: args[2] } }, function(err, r) {
                    if(err) return console.log(err);
                    if(r.matchedCount == 0) return msg.channel.sendMessage("Vous devez être validé pour compléter votre profil !");
                    if(r.modifiedCount == 1) return msg.channel.sendMessage("Profil mis à jour avec succès !");
                });
                break;
            case "steam":
                DB().collection('Students').updateOne({ clientID: msg.author.id, validated: true }, { $set: { "games.steam": args[2] } }, function(err, r) {
                    if(err) return console.log(err);
                    if(r.matchedCount == 0) return msg.channel.sendMessage("Vous devez être validé pour compléter votre profil !");
                    if(r.modifiedCount == 1) return msg.channel.sendMessage("Profil mis à jour avec succès !");
                });
                break;
            case "battlenet":
                DB().collection('Students').updateOne({ clientID: msg.author.id, validated: true }, { $set: { "games.battlenet": args[2] } }, function(err, r) {
                    if(err) return console.log(err);
                    if(r.matchedCount == 0) return msg.channel.sendMessage("Vous devez être validé pour compléter votre profil !");
                    if(r.modifiedCount == 1) return msg.channel.sendMessage("Profil mis à jour avec succès !");
                });
                break;
            case "lol":
                DB().collection('Students').updateOne({ clientID: msg.author.id, validated: true }, { $set: { "games.lol": args[2] } }, function(err, r) {
                    if(err) return console.log(err);
                    if(r.matchedCount == 0) return msg.channel.sendMessage("Vous devez être validé pour compléter votre profil !");
                    if(r.modifiedCount == 1) return msg.channel.sendMessage("Profil mis à jour avec succès !");
                });
                break;
            case "minecraft":
                DB().collection('Students').updateOne({ clientID: msg.author.id, validated: true }, { $set: { "games.minecraft": args[2] } }, function(err, r) {
                    if(err) return console.log(err);
                    if(r.matchedCount == 0) return msg.channel.sendMessage("Vous devez être validé pour compléter votre profil !");
                    if(r.modifiedCount == 1) return msg.channel.sendMessage("Profil mis à jour avec succès !");
                });
                break;
            default:
                return msg.channel.sendMessage(`${args[1]} : Opération inconnue. !aide pset pour plus d'infos !`);
        }
    }

    comProfil(msg, args) {
        let user = msg.mentions.users.array()[0];
        if(user === undefined)
            return msg.channel.sendMessage("Il faut mentionner l'utilisateur en précédant son pseudo par un @ !");

        if(!Config.EsiGuild.member(user).roles.has(Config.Roles['Validé']))
            return msg.channel.sendMessage("La personne n'est pas validée, impossible de savoir qui elle est " + Emojis.people.confused);

        DB().collection('Students').find({ clientID: user.id }).next(function(err, student) {
            if(err) return console.log(err);
            if(student === null) return console.log("Personne non validée dans la BDD a le rôle 'Validé' !");

            let profileText = `**${user.username}** s'apelle `;

            if(student.name) {
                profileText += `**${student.name}**`;
            } else {
                let noms = student.mail.split('@')[0].split('.');
                noms.forEach((n, i, t) => t[i] = n.charAt(0).toUpperCase() + n.slice(1));
                profileText += `**${noms[0]} ${noms[1]}**`;
            }
            profileText += ` et est en **${student.promo}** !\n`;

            if(student.games) {
                profileText += "\n\n__**Jeux :**__";
                if(student.games.steam)
                    profileText += `\n*Steam* : ${student.games.steam}`;
                if(student.games.battlenet)
                    profileText += `\n*Battle.net* : ${student.games.battlenet}`;
                if(student.games.lol)
                    profileText += `\n*League of Legends* : ${student.games.lol}`;
                if(student.games.minecraft)
                    profileText += `\n*Minecraft* : ${student.games.minecraft}`;
            }

            msg.channel.sendMessage(profileText);
        });
        return;
    }
}

module.exports = CGProfil;