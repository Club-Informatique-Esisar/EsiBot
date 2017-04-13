const MongoClient = require('mongodb').MongoClient;
const Constants = require('./Constants.js');

let db = null;

MongoClient.connect(Constants.DB_URL, function(err, db_ins) {
    if(err) return console.log(`Error while connecting to the database: ${err}`);

    console.log(`Successfully connected to the database!`);
    db = db_ins;
});

module.exports = function() {
    return db;
};