const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'bd.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {

  // Liste des formulaires
  db.all("SELECT id, title, group_id FROM forms ORDER BY created_at DESC", (err, rows) => {
    if (err) console.error("Erreur forms :", err);
    else console.log("Formulaires dans la base :", rows);
  });

  // Liste des groupes
  db.all("SELECT id, name FROM groups ORDER BY created_at DESC", (err, rows) => {
    if (err) console.error("Erreur groups :", err);
    else console.log("groups dans la base :", rows);
  });

});

db.close();
