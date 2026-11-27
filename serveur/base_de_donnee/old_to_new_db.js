// Script de fusion : copie les données d'une ancienne base (bd_old.db) dans la nouvelle (bd.db).
// À lancer une seule fois à la main (node nom_du_fichier.js), il ne fait pas partie du serveur.
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemins vers les bases
const newDbPath = path.resolve(__dirname, 'bd.db');       // Nouvelle base
const oldDbPath = path.resolve(__dirname, 'bd_old.db');   // Ancienne base

// Ouvrir les deux bases
const newDb = new sqlite3.Database(newDbPath);
const oldDb = new sqlite3.Database(oldDbPath);

// Helper pour exécuter une requête SQL avec promesse
function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// Helper pour récupérer toutes les lignes d'une requête
function all(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Copie les formulaires, puis leurs composants, puis les réponses de l'ancienne base vers la nouvelle
async function mergeDatabases() {
  try {
    // Forms
    // Les formulaires importés ne sont dans aucun groupe (group_id à null), car l'ancienne base n'avait pas de groupes
    const oldForms = await all(oldDb, 'SELECT * FROM forms');
    for (const form of oldForms) {
      // INSERT OR IGNORE : si l'id existe déjà dans la nouvelle base, la ligne est ignorée (pas de doublon)
      await run(newDb,
        `INSERT OR IGNORE INTO forms (id, title, json_data, created_at, updated_at, group_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [form.id, form.title, form.json_data, form.created_at, form.updated_at, null]
      );
    }

    // Components
    const oldComponents = await all(oldDb, 'SELECT * FROM components');
    for (const comp of oldComponents) {
      await run(newDb,
        `INSERT OR IGNORE INTO components (id, form_id, label, type, action, key_name, layout)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [comp.id, comp.form_id, comp.label, comp.type, comp.action, comp.key_name, comp.layout]
      );
    }

    // Responses
    const oldResponses = await all(oldDb, 'SELECT * FROM responses');
    for (const res of oldResponses) {
      await run(newDb,
        `INSERT OR IGNORE INTO responses (form_id, component_id, user_id, value, submitted_at)
         VALUES (?, ?, ?, ?, ?)`,
        [res.form_id, res.component_id, res.user_id, res.value, res.submitted_at]
      );
    }

    console.log('Merge terminé !');
  } catch (err) {
    console.error('Erreur lors du merge :', err);
  } finally {
    // Dans tous les cas, on referme les deux connexions
    newDb.close();
    oldDb.close();
  }
}

mergeDatabases();