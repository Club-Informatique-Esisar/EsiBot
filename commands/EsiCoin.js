const db = require("../SQLite.js")("bets.sqlite")

//#region Create Table

db.run(`
CREATE TABLE IF NOT EXISTS match (
    match_id INTEGER PRIMARY KEY,
    team1 TEXT NOT NULL,
    team2 TEXT NOT NULL,
    winner INTEGER NOT NULL,
    end_time TEXT
);
`)

db.run(`
CREATE TABLE IF NOT EXISTS bet (
    user_id INTEGER PRIMARY KEY,
    match_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES user (user_id) 
        ON DELETE CASCADE ON UPDATE NO ACTION
    FOREIGN KEY (match_id) REFERENCES match (match_id) 
        ON DELETE CASCADE ON UPDATE NO ACTION
);
`)

db.run(`
CREATE TABLE IF NOT EXISTS user (
    user_id INTEGER PRIMARY KEY,
    discord_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    bet_won INTEGER NOT NULL
);
`)

//#endregion

async function createUser(id) {
    await db.run("INSERT INTO user (discord_id, amount, bet_won) VALUES (?, ?, ?);", id, 100, 0)
}

async function initCommand({ message, args }) {
    //message.guild
    let rows = await db.all("SELECT * FROM user")
    let liste = "Users:\n"
    for (let row of rows) {
        liste += `${row.discord_id} - ${row.amount} EsiCoins\n`
    }
    message.channel.send(liste)
}

async function usersCommand({ message, args, emojis }) {
    let rows = await db.all("SELECT * FROM user")
    let liste = "Users:\n"
    for (let row of rows) {
        let member = await message.guild.fetchMember(row.discord_id)
        liste += `${member.user.username} - ${row.amount} EsiCoins\n`
    }
    await message.channel.send(liste)
}

async function queryCommand({ args }) {
    db.run(args[0])
}

async function amountCommand({ message }) {
    let memberId = message.member.id
    let res = await db.get("SELECT * FROM user WHERE discord_id = ?", memberId)
    if (res !== undefined) {
        await message.channel.send(`Vous avez ${res.amount} EsiCoins sur votre compte !`)
    } else {
        await createUser(memberId)
        await message.channel.send(`Votre compte vient d'être créé et a été crédité de ${res.amount} EsiCoins !`)
    }
}

module.exports = function (cm) {
    cm.registerCommand({
        name: 'bet-init',
        handler: initCommand,
        desc: 'Donne <n> argent à tout le monde et met tout le monde dans la db',
        args: 1,
        esiguildOnly: false,
        needAdmin: true
    })

    cm.registerCommand({
        name: 'bet-users',
        handler: usersCommand,
        desc: 'Liste des users du projet bet',
        args: 0,
        esiguildOnly: false,
        needAdmin: true
    })

    cm.registerCommand({
        name: 'amount',
        handler: amountCommand,
        desc: 'Affiche le nombre d\'EsiCoin que vous possédez',
        args: 0,
        esiguildOnly: false
    })

    cm.registerCommand({
        name: 'query',
        handler: queryCommand,
        desc: 'SQL Query sur la db SQLite',
        args: 1,
        params: '<query>',
        esiguildOnly: false,
        needAdmin: true
    })
}