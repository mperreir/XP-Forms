const db = require("../base_de_donnee/db");

const creategroup = (name) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO groups (name) VALUES (?)`,
      [name],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, name });
      }
    );
  });
};

const getAllgroups = () => {
  return new Promise((resolve, reject) => {
    let query = "SELECT * FROM groups";
    db.all(query, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const getgroupById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM groups WHERE id = ?`, [id], (err, group) => {
      if (err) return reject(err);
      if (!group) return resolve(null);

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

const renamegroup = (id, newName) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE groups SET name = ? WHERE id = ?`,
      [newName, id],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes > 0);
      }
    );
  });
};

const deletegroup = (id) => {
  return new Promise((resolve, reject) => {
    
    db.run(`UPDATE forms SET group_id = ? WHERE group_id = ?`, 
      [null, id], function (err) {
      if (err) return reject(err);

      db.all(`DELETE FROM groups WHERE id = ?`, [id], function (err) {9
        if (err) return reject(err);
          resolve(true);
      });
    });
  });
};


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


module.exports = {
  creategroup,
  getAllgroups,
  getgroupById,
  renamegroup,
  deletegroup,
  moveFormTogroup,
};
