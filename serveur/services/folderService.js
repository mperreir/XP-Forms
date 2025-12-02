const db = require("../base_de_donnee/db");

const createFolder = (name, parent_id = null) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO folders (name, parent_id) VALUES (?, ?)`,
      [name, parent_id],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, name, parent_id });
      }
    );
  });
};

const getAllFolders = (parent_id = null) => {
  return new Promise((resolve, reject) => {
    let query = "SELECT * FROM folders WHERE parent_id IS ?";
    db.all(query, [parent_id], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const getFolderById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM folders WHERE id = ?`, [id], (err, folder) => {
      if (err) return reject(err);
      if (!folder) return resolve(null);

      db.all(
        `SELECT id, title FROM forms WHERE folder_id = ? ORDER BY created_at DESC`,
        [id],
        (err, forms) => {
          if (err) return reject(err);
          folder.forms = forms;
          resolve(folder);
        }
      );
    });
  });
};

const renameFolder = (id, newName) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE folders SET name = ? WHERE id = ?`,
      [newName, id],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      }
    );
  });
};

const deleteFolder = (id) => {
  return new Promise((resolve, reject) => {
    
    db.run(`DELETE FROM forms WHERE folder_id = ?`, [id], function (err) {
      if (err) return reject(err);

      db.all(`SELECT id FROM folders WHERE parent_id = ?`, [id], (err, subFolders) => {
        if (err) return reject(err);

        Promise.all(subFolders.map(sf => deleteFolder(sf.id)))
          .then(() => {

            db.run(`DELETE FROM folders WHERE id = ?`, [id], function (err) {
              if (err) return reject(err);
              resolve(true);
            });

          })
          .catch(reject);
      });
    });
  });
};


const moveFormToFolder = (formId, folderId) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE forms SET folder_id = ? WHERE id = ?`,
      [folderId, formId],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      }
    );
  });
};

const removeFormFromFolder = (formId) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE forms SET folder_id = NULL WHERE id = ?`,
      [formId],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      }
    );
  });
};

module.exports = {
  createFolder,
  getAllFolders,
  getFolderById,
  renameFolder,
  deleteFolder,
  moveFormToFolder,
  removeFormFromFolder
};
