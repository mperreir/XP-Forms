// Service des groupes : accès à la base de données (SQLite) pour les groupes de formulaires.
// Appelé par groupController.
const db = require("../base_de_donnee/db");

// Crée un groupe et renvoie son id (généré par la base) avec son nom
const creategroup = (name) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO groups (name) VALUES (?)`,
      [name],
      function (err) {
        if (err) return reject(err);
        // this.lastID : id de la ligne qui vient d'être insérée
        resolve({ id: this.lastID, name });
      }
    );
  });
};

// Renvoie tous les groupes
const getAllgroups = () => {
  return new Promise((resolve, reject) => {
    let query = "SELECT * FROM groups";
    db.all(query, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// Renvoie un groupe avec la liste de ses formulaires (id et titre), ou null s'il n'existe pas
const getgroupById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM groups WHERE id = ?`, [id], (err, group) => {
      if (err) return reject(err);
      if (!group) return resolve(null);

      // On ajoute les formulaires du groupe, du plus récent au plus ancien
      db.all(
        `SELECT id, title FROM forms WHERE group_id = ? ORDER BY created_at DESC`,
        [id],
        (err, forms) => {
          if (err) return reject(err);
          group.forms = forms;
          resolve(group);
        }
      );
    });
  });
};

// Renomme un groupe ; renvoie true si un groupe a bien été modifié
const renamegroup = (id, newName) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE groups SET name = ? WHERE id = ?`,
      [newName, id],
      function (err) {
        if (err) return reject(err);
        // this.changes : nombre de lignes modifiées (0 = id introuvable)
        resolve(this.changes > 0);
      }
    );
  });
};

// Supprime un groupe ; ses formulaires sont conservés mais ne sont plus dans aucun groupe
const deletegroup = (id) => {
  return new Promise((resolve, reject) => {
    
    // 1. On retire d'abord les formulaires du groupe (group_id à null)
    db.run(`UPDATE forms SET group_id = ? WHERE group_id = ?`, 
      [null, id], function (err) {
      if (err) return reject(err);

      // 2. Puis on supprime le groupe lui-même
      db.all(`DELETE FROM groups WHERE id = ?`, [id], function (err) {9
        if (err) return reject(err);
          resolve(true);
      });
    });
  });
};


// Déplace un formulaire vers un groupe ; renvoie true si le formulaire a été modifié
const moveFormTogroup = (formId, groupId) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE forms SET group_id = ? WHERE id = ?`,
      [groupId, formId],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      }
    );
  });
};

// Compte les formulaires d'un groupe
const getNumberOfForms = (id) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM forms WHERE group_id = ?',
      [id],
      (err, row) => {
        if (err) return reject(err);
        resolve(row.count);
      }
    )
  })
}

// Fonctions exposées au contrôleur
module.exports = {
  creategroup,
  getAllgroups,
  getgroupById,
  renamegroup,
  deletegroup,
  moveFormTogroup,
  getNumberOfForms,
};