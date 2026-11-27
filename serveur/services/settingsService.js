// Service des paramètres : lecture et écriture de paramètres clé/valeur dans la table "settings".
// Utilisé par settingsController (par exemple pour l'id participant par défaut).
const db = require("../base_de_donnee/db");

// Renvoie la valeur d'un paramètre à partir de sa clé
exports.getSetting = (key) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT value FROM settings WHERE key = ?`, [key], (err, row) => {
        if (err) return reject(err);
        resolve(row ? row.value : null); // retourne null si pas trouvé
      });
    });
  };
  
  // Enregistre un paramètre : on le crée s'il n'existe pas, sinon on met sa valeur à jour
  exports.setSetting = (key, value) => {
    return new Promise((resolve, reject) => {
      db.run(
        `
        INSERT INTO settings (key, value)
        VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `,
        [key, value],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });
  };