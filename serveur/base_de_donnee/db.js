// base_de_donnee/db.js
// Ouvre la connexion à la base de données SQLite, partagée par tous les services
const sqlite3 = require("sqlite3").verbose(); // verbose() : messages d'erreur plus détaillés
const path = require("path");
// Le fichier de base de données "bd.db" est stocké dans le même dossier que ce fichier
// (il est créé automatiquement s'il n'existe pas)
const db = new sqlite3.Database(path.resolve(__dirname, "bd.db"));
// On exporte la connexion : les services font simplement require("../base_de_donnee/db")
module.exports = db;