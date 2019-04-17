const sqlite3 = require('sqlite3').verbose()

class SQLite {
    constructor(file) {
        this.file = file
        this.db = new sqlite3.Database(file)
    }

    /*
    Database#close([callback])
    Database#configure(option, value)
    Database#get(sql, [param, ...], [callback])
    Database#exec(sql, [callback])
    Database#prepare(sql, [param, ...], [callback])
    */

    run(sql, ...params) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (err) => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    get(sql, ...params) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(row)
                }
            })
        })
    }

    each(sql, ...params) {
        return new Promise((resolve, reject) => {
            const queries = [];
            this.db.each(sql, params, (err, row) => {
                if (err) {
                    reject(err)
                } else {
                    queries.push(row)
                }
            }, (err, n) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(queries)
                }
            })
        })
    }

    all(sql, ...params) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(rows)
                }
            })
        })
    }
}

module.exports = function(file) {
    return new SQLite(file)
}