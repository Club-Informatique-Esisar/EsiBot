const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('bets.sqlite')

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

async function usersCommand({ message, args, emojis }) {
    db.all("SELECT * FROM user", function(err, rows) {
        let liste = "Users:\n"
        for (let row of rows) {
            liste += `${row.discord_id} - ${row.amount} EsiCoins\n`
        }
        message.channel.send(liste)
    })
}

async function queryCommand({ args }) {
    db.run(args[0])
}

module.exports = function (cm) {
    cm.registerCommand({
        name: 'bet-users',
        handler: usersCommand,
        desc: 'Liste des users du projet bet',
        args: 0,
        esiguildOnly: false,
        needAdmin: true
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