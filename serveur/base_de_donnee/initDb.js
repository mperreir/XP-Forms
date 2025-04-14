const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Chemin vers la base de données
const dbPath = path.resolve(__dirname, 'bd.db'); // Base de données SQLite

// Vérification si la base de données existe
if (!fs.existsSync(dbPath)) {
  console.log('Base de données SQLite non trouvée. Création de la base...');

  // Créer la base de données SQLite
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Erreur lors de l\'ouverture de la base de données :', err.message);
      return;
    }

    console.log('Base de données SQLite ouverte avec succès.');

    // Lire et exécuter les requêtes SQL pour créer les tables
    const sql = fs.readFileSync(path.resolve(__dirname, 'bd.sql'), 'utf-8');

    db.exec(sql, (err) => {
      if (err) {
        console.error('Erreur lors de la création des tables :', err.message);
        return;
      }
      console.log('Base de données initialisée avec succès.');
    });

    db.close();
  });
} else {
  console.log('Base de données SQLite déjà existante.');
}
