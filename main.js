Constants = require('./Constants.js');
const Discord = require('discord.js');
const client = new Discord.Client();
const emojis = require('discord-emoji');

let words = {};
let roles = {};

client.on('ready', () => {
    console.log(`Successfully logged in as ${client.user.username}!`);
    for(let g of client.guilds) {
        if(g[0] === Constants.EsiGuildID) {
            Constants.EsiGuild = g[1];
        }
    }

    Constants.EsiGuild.roles.forEach(r => Constants.Roles[r.name] = r.id);
});

function listenWord(w) {
    console.log(`Registered ${w} for listening`);
    words[w] = { count: 0 };
}

listenWord('hey');

const CommandManager = require('./CommandManager.js');
commandManager = new CommandManager('!');
client.on('message', commandManager.getListener());

client.on('message', msg => {
    return;

    if(msg.author.bot) return;
    if(!msg.content.startsWith('!')) {
        for(let w of Object.keys(words)) {
            if(msg.content.includes(w)) {
                words[w].count++;
            }
        }
        if(msg.content.includes('hey')) {
            msg.react(':derp_fap:272678947828006912')
            .catch(console.error);
        }
        return;
    }

    switch(name) {
        case "count":
            if(words[args[1]])
                msg.channel.sendMessage(`Count for ${args[1]} : ${words[args[1]].count}`);
            break;
        case "listen":
            if(args[1]) {
                listenWord(args[1]);
                msg.channel.sendMessage(`Now counting occurences for ${args[1]}`);
            }
            break;
    }
});

client.login('MjcyNTA5ODExNTQ1ODY2MjQw.C5X7wQ.CVQPQ3UYSuSMUCdfvB4MeWbdcVk');