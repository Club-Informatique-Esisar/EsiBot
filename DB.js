const MongoClient = require('mongodb').MongoClient;

let db = null;
let url = 'mongodb://localhost:27017/esibot';

MongoClient.connect(url, function(err, db_ins) {
    if(err) return console.log(`Error while connecting to the database: ${err}`);

    console.log(`Successfully connected to the database!`);
    db = db_ins;
});

module.exports = function() {
    return db;
};