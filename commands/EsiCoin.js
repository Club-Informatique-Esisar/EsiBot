const db = require("../SQLite.js")("bets.sqlite")

let MatchState = {
    BetOpen: 0,
    BetClose: 1,
    Team1Won: 2,
    Team2Won: 3,
    Equality: 4,

    Min: 0,
    Max: 4
}

//#region Create Table

db.run(`
CREATE TABLE IF NOT EXISTS match (
    match_id INTEGER PRIMARY KEY,
    team1 TEXT NOT NULL,
    team2 TEXT NOT NULL,
    state INTEGER NOT NULL,
    end_time TEXT
);
`)

db.run(`
CREATE TABLE IF NOT EXISTS bet (
    user_id INTEGER NOT NULL,
    match_id INTEGER NOT NULL,
    team INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user (user_id) 
        ON DELETE CASCADE ON UPDATE NO ACTION,
    FOREIGN KEY (match_id) REFERENCES match (match_id) 
        ON DELETE CASCADE ON UPDATE NO ACTION
);
`)

db.run(`
CREATE TABLE IF NOT EXISTS user (
    user_id INTEGER PRIMARY KEY,
    discord_id TEXT UNIQUE NOT NULL,
    amount INTEGER NOT NULL,
    bet_won INTEGER NOT NULL
);
`)

//#endregion

async function createUser(discordId) {
    await db.run("INSERT INTO user (discord_id, amount, bet_won) VALUES (?, ?, ?)", discordId, 100, 0)
}

async function getUser(discordId) {
    return await db.get("SELECT * FROM user WHERE discord_id = ?", discordId)
}

async function createMatch(team1, team2) {
    return await db.run("INSERT INTO match (team1, team2, state) VALUES (?, ?, ?)", team1, team2, 0)
}

async function getMatch(matchId) {
    return await db.get("SELECT * FROM match WHERE match_id = ?", matchId)
}

function getMatchDesc(match, admin) {
    if (admin === true)
        return `#${match.match_id} | [1] - ${match.team1} VS ${match.team2} - [2] | ${match.state}`
    else
        return `#${match.match_id} | [1] - ${match.team1} VS ${match.team2} - [2]`
}

async function getBet(userId, matchId) {
    return await db.get("SELECT * FROM bet WHERE user_id = ? AND match_id = ?", userId, matchId)
}

async function initCommand({ message }) {
    await message.guild.fetchMembers()
    message.guild.members.forEach((member, id) => {
        createUser(id)
    })
    await message.channel.send("Tous les comptes ont bien été créés !")
}

async function redeemCommand({ message, args }) {
    await db.run(`UPDATE user
        SET amount = ?
        WHERE amount = 0
            AND NOT EXISTS (
                SELECT * FROM bet
                WHERE bet.user_id = user.user_id
                    AND bet.match_id = ?
            )`, +args[0], +args[1])
    await message.channel.send("Les comptes vides ont bien été crédités !")
}

async function newMatchCommand({ message, args }) {
    await createMatch(args[0], args[1])
    await message.channel.send("Nouveau match créé!")
}

async function listMatchCommand({ message, colors }) {
    let isAdmin = message.member.hasPermission("ADMINISTRATOR")
    let rows = []

    if (isAdmin)
        rows = await db.all("SELECT * FROM match ORDER BY match_id DESC")
    else
        rows = await db.all("SELECT * FROM match WHERE state = 0 ORDER BY match_id DESC")

    let liste = ""
    for (let row of rows) {
        liste += getMatchDesc(row, isAdmin) + "\n"
    }
    
    await message.channel.send({
        embeds: [{
            title: `Liste des matchs en cours`,
            color: colors.default,
            description: liste
        }]
    })
}

async function setStateCommand({ message, args }) {
    let matchId = +args[0]
    let state = +args[1]
    if (state < MatchState.Min || state > MatchState.Max) {
        await message.channel.send(`Les valeurs valide d'état d'un match sont comprises entre ${MatchState.Min} et ${MatchState.Max}`)
        return
    }

    let match = await getMatch(matchId)
    if (match === undefined) {
        await message.channel.send(`Le match ${matchId} n'existe pas.`)
        return
    }

    await db.run("UPDATE match SET state = ? WHERE match_id = ?", state, matchId)
    await message.channel.send(`Nouvel état pour le match ${getMatchDesc(match)}`)
}

async function stopCommand({ message, args }) {
    let matchId = +args[0]
    let match = await getMatch(matchId)
    if (match === undefined) {
        await message.channel.send(`Le match ${matchId} n'existe pas.`)
        return
    }

    if (match.state != MatchState.BetOpen) {
        await message.channel.send(`Le match ${matchId} n'est pas ouvert, pour forcer un changement d'état utilisez setState.`)
        return
    }

    await db.run("UPDATE match SET state = ? WHERE match_id = ?", MatchState.BetClose, matchId)
    await message.channel.send(`Le match ${getMatchDesc(match)} est désormais fermé`)
}

async function resultCommand({ message, args }) {
    let winner = +args[1]
    if (winner < 0 || winner > 2) {
        await message.channel.send(`Le paramètre vainqueur doit valoir 0, 1, ou 2, soit respectivement égalité, victoire équipe 1 ou victoire équipe 2)`)
        return
    }

    let matchId = +args[0]
    let match = await getMatch(matchId)
    if (match === undefined) {
        await message.channel.send(`Le match ${matchId} n'existe pas.`)
        return
    }

    if (match.state != MatchState.BetClose) {
        await message.channel.send(`Le match ${matchId} n'est pas fermé, pour forcer un changement d'état utilisez setState.`)
        return
    }

    let winnerEnum
    let winnerStr
    switch (winner) {
        case 0:
            winnerEnum = MatchState.Equality
            winnerStr = "Une égalité"
            break;
        case 1:
            winnerEnum = MatchState.Team1Won
            winnerStr = match.team1
            break;
        case 2:
            winnerEnum = MatchState.Team2Won
            winnerStr = match.team2
            break;
    }

    await db.run("BEGIN TRANSACTION")

    await db.run("UPDATE match SET state = ? WHERE match_id = ?", winnerEnum, match.match_id)
    let totalBets = (await db.get("SELECT SUM(amount) as total FROM bet WHERE match_id = ?", match.match_id)).total
    let totalWinnerBets = (await db.get("SELECT SUM(amount) as total FROM bet WHERE match_id = ? AND team = ?", match.match_id, winner)).total
    db.run(`UPDATE user
        SET amount = amount +
            ROUND((
                SELECT bet.amount
                FROM bet
                WHERE bet.user_id = user.user_id
                    AND bet.match_id = ?
                    AND bet.team = ?
                ) / (? * 1.0) * ?)
        WHERE EXISTS (
            SELECT bet.amount
            FROM bet
            WHERE bet.user_id = user.user_id
                AND bet.match_id = ?
                AND bet.team = ?
        )`, matchId, winner, totalWinnerBets, totalBets, matchId, winner)

    await db.run("COMMIT")
    
    if (winner !== 0)
        await message.channel.send(`L'équipe *${winnerStr}* a été déclarée vainqueur pour le match ${getMatchDesc(match)} ! Les gains ont été répartis entre les parieurs.`)
    else
        await message.channel.send(`Le match ${getMatchDesc(match)} s'est soldé par une égalité ! Dommage !`)
}

async function topCommand({ message, colors }) {
    let rows = await db.all("SELECT * FROM user ORDER BY amount DESC LIMIT 20")
    let liste = ""
    for (let row of rows) {
        let member = await message.guild.fetchMember(row.discord_id)
        liste += `${member.user.username} - ${row.amount} EsiCoins\n`
    }
    await message.channel.send({
        embeds: [{
            title: `Top 20 des parieurs par EsiCoins`,
            color: colors.default,
            description: liste
        }]
    })
}

async function topBetCommand({ message, colors }) {
    let rows = await db.all(`SELECT discord_id, COUNT(*) as won
        FROM bet
        LEFT JOIN user ON user.user_id = bet.user_id
        LEFT JOIN match ON match.match_id = bet.match_id
        WHERE match.state = bet.team + 1
        GROUP BY user.user_id
        ORDER BY won DESC LIMIT 20`)
    let liste = ""
    for (let row of rows) {
        let member = await message.guild.fetchMember(row.discord_id)
        liste += `${member.user.username} - ${row.won} pari(s) gagné(s)\n`
    }
    await message.channel.send({
        embeds: [{
            title: `Top 20 des parieurs par nombre de paris gagnés`,
            color: colors.default,
            description: liste
        }]
    })
}

async function showBetCommand({ message, args, colors }) {
    let matchId = +args[0]
    let match = await getMatch(matchId)
    
    if (match === undefined) {
        await message.channel.send("Match introuvable.")
        return
    }
    
    let rows = await db.all(`SELECT discord_id, team, bet.amount as amount
        FROM bet
        LEFT JOIN user ON user.user_id = bet.user_id
        WHERE match_id = ?
        ORDER BY team, bet.amount DESC`, matchId)
    let liste = ""
    for (let row of rows) {
        let member = await message.guild.fetchMember(row.discord_id)
        liste += `**${member.user.username}** a parié **${row.amount}** sur **${row.team == 1 ? match.team1 : match.team2}**\n`
    }
    await message.channel.send({
        embeds: [{
            title: `Paris en cours sur le match **${match.team1} - ${match.team2}**`,
            color: colors.default,
            description: liste
        }]
    })
}

async function amountCommand({ message }) {
    let memberId = message.member.id
    let res = await getUser(memberId)
    if (res !== undefined) {
        await message.channel.send(`Vous avez ${res.amount} EsiCoins sur votre compte !`)
    } else {
        await createUser(memberId)
        await message.channel.send(`Votre compte a bien été créé et a été crédité de 100 EsiCoins !`)
    }
}

async function betCommand({ message, args }) {
    let matchId = +args[0]
    let team = +args[1]
    let amount = +args[2]
    
    if (amount <= 0) {
        await message.channel.send(`Impossible de faire un pari négatif ou nul !`)
        return
    }

    let memberId = message.member.id
    let user = await getUser(memberId)
    
    if (user === undefined) {
        await createUser(memberId)
        user = await getUser(memberId)
        await message.channel.send(`Compte créé avec 100 EsiCoins.`)
    }
    
    let match = await getMatch(matchId)
    
    if (match === undefined) {
        await message.channel.send(`Le match ${matchId} n'existe pas !`)
        return
    }
    
    let bet = await getBet(user.user_id, matchId)

    if (bet !== undefined) {
        await message.channel.send(`Vous avez déjà misé sur ce match ! Si vous voulez modifier votre mise, faites d'abord !bet undoBet ${match.match_id}`)
        return
    }

    if (match.state != MatchState.BetOpen) {
        await message.channel.send(`Il n'est plus possible de miser sur ce match car il est en cours ou terminé !`)
        return
    }

    if (team != 1 && team != 2) {
        await message.channel.send(`L'équipe doit être 1 ou 2 ! Rappel du match :\n${getMatchDesc(match)}`)
        return
    }

    if (user.amount < amount) {
        await message.channel.send(`Vous n'avez pas assez d'argent sur votre compte, il ne vous reste que ${user.amount} !`)
        return
    }

    await db.run("BEGIN TRANSACTION")

    try {
        await db.run("UPDATE user SET amount = amount - ? WHERE user_id = ?", amount, user.user_id)
        await db.run("INSERT INTO bet (user_id, match_id, team, amount) VALUES (?, ?, ?, ?)", user.user_id, match.match_id, team, amount)
        await db.run("COMMIT")
        
        await message.channel.send(`La mise suivante a bien été prise en compte : **${amount}** EsiCoins sur l'équipe **${team == 1 ? match.team1 : match.team2}** du match **${match.match_id}**`)
    }
    catch (err) {
        console.error(err)
        await db.run("ROLLBACK")
        
        await message.channel.send(`Stop faire nawak avec les commandes !`)
    }
}

async function undoBetCommand({ message, args }) {
    let matchId = +args[0]

    let memberId = message.member.id
    let user = await getUser(memberId)
    let match = await getMatch(matchId)
    let bet = await getBet(user.user_id, match.match_id)

    if (bet === undefined) {
        await message.channel.send(`Vous n'avez pas de paris en cours sur le match ${match.match_id} ! (ou le match n'existe pas)`)
        return
    }

    if (match.state != MatchState.BetOpen) {
        await message.channel.send(`Les paris sont fermés sur le match ${match.match_id}, impossible d'annuler votre mise.`)
        return
    }

    await db.run("BEGIN TRANSACTION")

    try {
        await db.run("DELETE FROM bet WHERE user_id = ? AND match_id = ?", user.user_id, match.match_id)
        await db.run("UPDATE user SET amount = amount + ? WHERE user_id = ?", bet.amount, user.user_id)
        
        await db.run("COMMIT")
        
        await message.channel.send(`Votre mise de ${bet.amount} sur le match ${match.match_id} a bien été annulée.`)
    } catch (err) {
        console.error(err)
        await db.run("ROLLBACK")
        
        await message.channel.send(`Stop faire nawak avec les commandes !`)
    }
}

module.exports = function (cm) {
    cm.registerCommand({
        name: 'bet',
        desc: 'Système de paris',
        variableArgs: true,
        subcommands: [
            // Admin-only
            {
                name: 'init',
                handler: initCommand,
                desc: 'Crée un compte pour tous les membres actuels de la guilde',
                esiguildOnly: false,
                needAdmin: true
            },
            {
                name: 'redeem',
                handler: redeemCommand,
                desc: `Redonne <amount> à ceux qui n'ont plus d'EsiCoins, sauf s'ils ont parié sur <last_match>`,
                args: 2,
                params: "<amount> <last_match>",
                esiguildOnly: false,
                needAdmin: true
            },
            {
                name: 'newMatch',
                handler: newMatchCommand,
                desc: 'Crée un nouveau match',
                args: 2,
                params: "<equipe 1> <equipe 2>",
                esiguildOnly: false,
                needAdmin: true
            },
            {
                name: 'setState',
                handler: setStateCommand,
                desc: `Définit l'état d'un match`,
                args: 2,
                params: "<matchId> <nouvel_état[0-4](BetOpen: 0, BetClose: 1, Team1Won: 2, Team2Won: 3, Equality: 4)>",
                esiguildOnly: false,
                needAdmin: true
            },
            {
                name: 'stop',
                handler: stopCommand,
                desc: `Ferme les paris pour un match`,
                args: 1,
                params: "<matchId>",
                esiguildOnly: false,
                needAdmin: true
            },
            {
                name: 'result',
                handler: resultCommand,
                desc: `Désigne le vainqueur d'un match`,
                args: 2,
                params: "<matchId> <vainqueur(Égalité: 0, Team1: 1, Team2: 2)>",
                esiguildOnly: false,
                needAdmin: true
            },
            {
                name: 'topCoins',
                handler: topCommand,
                desc: 'Affiche le classement par EsiCoins',
                esiguildOnly: false,
                needAdmin: true
            },
            {
                name: 'topBets',
                handler: topBetCommand,
                desc: 'Affiche le classement par nombre de paris gagnés',
                esiguildOnly: false,
                needAdmin: true
            },
            {
                name: 'showBets',
                handler: showBetCommand,
                desc: 'Affiche les paris pour un match donné',
                args: 1,
                params: "<matchId>",
                esiguildOnly: false,
                needAdmin: true
            },
            // All
            {
                name: 'amount',
                handler: amountCommand,
                desc: 'Affiche le nombre d\'EsiCoin que vous possédez',
                esiguildOnly: false
            },
            {
                name: 'bet',
                handler: betCommand,
                desc: 'Mise <amount> sur la team <team> du match <match_id>',
                args: 3,
                params: "<match_id> <team (1 ou 2)> <amount>",
                esiguildOnly: false
            },
            {
                name: 'listMatch',
                handler: listMatchCommand,
                desc: 'Liste les matchs en cours',
                esiguildOnly: false
            },
            {
                name: 'undoBet',
                handler: undoBetCommand,
                desc: "Annule la mise sur le match <match_id> si c'est encore possible",
                args: 1,
                params: "<match_id>",
                esiguildOnly: false
            }
        ],
        esiguildOnly: false
    })
}