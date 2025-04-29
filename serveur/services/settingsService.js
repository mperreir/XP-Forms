const db = require("../base_de_donnee/db");

exports.getSetting = (key) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT value FROM settings WHERE key = ?`, [key], (err, row) => {
        if (err) return reject(err);
        resolve(row ? row.value : null); // retourne null si pas trouvé
      });
    });
  };
  
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