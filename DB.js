const MongoClient = require('mongodb').MongoClient;
const Config = require('./Config.js');

let db = null;

MongoClient.connect(Config.DB_URL, function(err, db_ins) {
    if(err) return console.log(`Error while connecting to the database: ${err}`);

    console.log(`Successfully connected to the database!`);
    db = db_ins;
});

module.exports = function() {
    return db;
};