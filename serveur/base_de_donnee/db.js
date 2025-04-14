// base_de_donnee/db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const db = new sqlite3.Database(path.resolve(__dirname, "bd.db"));
module.exports = db;
