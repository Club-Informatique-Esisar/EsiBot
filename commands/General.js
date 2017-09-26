const CommandGroup = require('./CommandGroup.js');
const DB = require('./../DB.js');
const Config = require('./../Config.js');
const Emojis = require('discord-emoji');

class CGGeneral extends CommandGroup {
    constructor(manager) {
        super(manager);
    }
}

module.exports = CGGeneral;