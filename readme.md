Voici le code de l'extension. Comme dit dans la vidéo, ça a été fait en 1 jour, il y a quelques trucs pas tops, surtout au niveau de la sécurité :) Mais ça marche ! N'hésitez pas à le refaire en mieux.

Faut aussi créer une BDD pour stocker les infos. La mienne ressemble à ça : 

```
CREATE TABLE `fraudes` (
  `ID` int NOT NULL AUTO_INCREMENT,
  `tweet_id` bigint DEFAULT NULL,
  `voted_by` varchar(200) DEFAULT NULL,
  `created_at` timestamp(6) NULL DEFAULT NULL,
  `tweeted_at` timestamp(6) NULL DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

```

Côté serveur, pour faire le lien avec la BDD, en expressjs pour moi, ça donne un truc comme ça :

```javascript
const express = require('express');
const bodyParser = require('body-parser')
const path = require('path');
const cors = require("cors");
const DatabaseTapin = require('./database_tapin')
var mysql2 = require('mysql2/promise');
const port = process.env.PORT || 3000;
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const database = new Database()
const database_tapin = new DatabaseTapin()


app.get('/api/no_tap_in', function (req, res) {
  database_tapin.get_user_and_all_fraudes(req.query.user_id, function(err, results){
    res.json(results)
  })
});

app.post('/api/no_tap_in', function(req, res){
  database_tapin.add_tweet_frauduleux(req.body['tweet_id'], req.body['user_id'], req.body['tweeted_at'], function(err, results){
    res.json(results)
  })
})
```

et

```javascript
const { createProxy } = require('http-proxy');
var mysql = require('mysql2');
const moment = require('moment')

module.exports = class DatabaseTapIn {
    constructor() {
        this.connection = mysql.createConnection({
            host    :process.env.DB_HOST,
            user    :process.env.DB_USER,
            password:process.env.DB_PASSWORD,
            database:process.env.DB_NAME_TAPIN,
            supportBigNumbers: true
        });
        this.connection.connect()
        this.table = process.env.DB_TABLE_TAPIN
        this.fraude = 6
    }

    get_user_fraudes = (userId, callback) => {
        var sql = "SELECT tweet_id FROM " + this.table + " WHERE tweeted_at > (now() - INTERVAL 8 DAY) AND voted_by = '" + userId + "'"
        this.connection.query(sql, function(err, results){
            callback(err, results)
        })
    }

    get_all_fraudes = (callback) => {
        var sql = "SELECT tweet_id FROM " + this.table + " WHERE tweeted_at > (now() - INTERVAL 8 DAY) GROUP BY tweet_id HAVING COUNT(*) >= " + this.fraude
        this.connection.query(sql, function(err, results){
            callback(err, results)
        })
    }

    get_user_and_all_fraudes = (userId, callback) => {
        var sql = "SELECT tweet_id FROM " + this.table + " WHERE voted_by = '" + userId + "' UNION SELECT tweet_id FROM fraudes WHERE tweeted_at > (now() - INTERVAL 8 DAY) GROUP BY tweet_id HAVING COUNT(*) >= " + this.fraude
        this.connection.query(sql, function(err, results){
            callback(err, results)
        })
    }

    add_tweet_frauduleux = (tweet_id, voted_by, tweeted_at, callback) => {
        var sql = "INSERT INTO " + this.table + "(tweet_id, voted_by, created_at, tweeted_at) VALUES('"+tweet_id+"', '"+voted_by+"', '"+moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')+"', '"+moment(tweeted_at).format('YYYY-MM-DD HH:mm:ss')+"')"
        this.connection.query(sql, function(err, results){
            callback(err, results)
        })
    }

}
```
