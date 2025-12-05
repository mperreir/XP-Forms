const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'bd.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(
        "ALTER TABLE forms ADD COLUMN group_id INTEGER REFERENCES groups(id);",
        (err) => {
            if (err) {
                console.error("Erreur ALTER TABLE :", err.message);
            } else {
                console.log("Colonne group_id ajoutée avec succès !");
            }
        }
    );
});

db.close();
