require("../base_de_donnee/initDb.js"); // facultatif si déjà appelé une fois ailleurs
const db = require("../base_de_donnee/db");


const saveForm = (id, title, json_data) => {
  return new Promise((resolve, reject) => {
    const components = json_data.components || [];

    db.run("BEGIN TRANSACTION", (err) => {
      if (err) return reject(err);

      db.run(
        "INSERT INTO forms (id, title, json_data) VALUES (?, ?, ?)",
        [id, title, JSON.stringify(json_data)],
        (err) => {
          if (err) {
            db.run("ROLLBACK");
            return reject(err);
          }

          components.forEach((c) => {
            db.run(
              "INSERT INTO components (id, form_id, label, type, key_name, layout) VALUES (?, ?, ?, ?, ?, ?)",
              [c.id, id, c.label || "", c.type, c.key || "", JSON.stringify(c.layout)],
              (err) => {
                if (err) {
                  db.run("ROLLBACK");
                  return reject(err);
                }
              }
            );
          });

          db.run("COMMIT", (err) => {
            if (err) return reject(err);
            resolve("Formulaire et composants enregistrés !");
          });
        }
      );
    });
  });
};

const getAllForms = () => {
  return new Promise((resolve, reject) => {
    db.all("SELECT id, title, created_at, updated_at FROM forms ORDER BY created_at DESC", (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const getFormById = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT id, json_data, created_at FROM forms WHERE id = ?", [id], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error("Formulaire non trouvé"));

      try {
        const jsonData = JSON.parse(row.json_data);
        if (!jsonData || !jsonData.components) {
          return reject(new Error("Le formulaire ne contient pas de composants valides."));
        }
        resolve({ id: row.id, json_data: jsonData, created_at: row.created_at });
      } catch (e) {
        reject(new Error("Erreur lors du traitement du schéma du formulaire"));
      }
    });
  });
};

const hasResponses = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT COUNT(*) AS total FROM responses WHERE form_id = ?", [id], (err, row) => {
      if (err) return reject(err);
      resolve(parseInt(row.total) > 0);
    });
  });
};

const updateForm = (id, title, json_data) => {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE forms SET title = ?, json_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [title, JSON.stringify(json_data), id],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes); // return 0 if not found
      }
    );
  });
};

const deleteForm = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT COUNT(*) AS total FROM responses WHERE form_id = ?", [id], (err, row) => {
      if (err) return reject(err);

      const total = parseInt(row.total);
      if (total > 0) {
        db.run("BEGIN TRANSACTION", (err) => {
          if (err) return reject(err);

          db.run("DELETE FROM response_values WHERE response_id IN (SELECT id FROM responses WHERE form_id = ?)", [id]);
          db.run("DELETE FROM responses WHERE form_id = ?", [id]);

          db.run("DELETE FROM forms WHERE id = ?", [id], (err) => {
            if (err) return reject(err);
            db.run("COMMIT", (err) => {
              if (err) return reject(err);
              resolve("Formulaire et réponses supprimés avec succès !");
            });
          });
        });
      } else {
        db.run("DELETE FROM forms WHERE id = ?", [id], (err) => {
          if (err) return reject(err);
          resolve("Formulaire supprimé avec succès !");
        });
      }
    });
  });
};


// Service function to duplicate a form
const duplicateForm = async (formId) => {
  return new Promise((resolve, reject) => {
    db.run("BEGIN TRANSACTION");

    // Step 1: Duplicate the form
    db.get("SELECT * FROM forms WHERE id = ?", [formId], (err, form) => {
      if (err) {
        db.run("ROLLBACK");
        return reject({ success: false, error: err.message });
      }

      if (!form) {
        db.run("ROLLBACK");
        return reject({ success: false, error: "Formulaire introuvable" });
      }

      // Generate new form ID and title
      const newFormId = `new_id_${Math.floor(Math.random() * 1000000)}`;
      const newTitle = `${form.title} (copy)`;
      const newJsonData = form.json_data;

      // Step 2: Insert the new form with the generated ID
      db.run(
        "INSERT INTO forms (id, title, json_data, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
        [newFormId, newTitle, newJsonData],
        (err) => {
          if (err) {
            db.run("ROLLBACK");
            return reject({ success: false, error: err.message });
          }

          // Step 3: Duplicate the components
          db.all("SELECT * FROM components WHERE form_id = ?", [formId], (err, components) => {
            if (err) {
              db.run("ROLLBACK");
              return reject({ success: false, error: err.message });
            }

            // Insert each component with new IDs linked to the new form
            components.forEach((component) => {
              const newComponentId = `new_id_${Math.floor(Math.random() * 1000000)}`;
              db.run(
                "INSERT INTO components (id, form_id, label, type, action, key_name, layout) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                  newComponentId,
                  newFormId,
                  component.label,
                  component.type,
                  component.action,
                  component.key_name,
                  component.layout,
                ],
                (err) => {
                  if (err) {
                    db.run("ROLLBACK");
                    return reject({ success: false, error: err.message });
                  }
                }
              );
            });

            // Step 4: Commit the transaction
            db.run("COMMIT");
            resolve({ success: true, newFormId });
          });
        }
      );
    });
  });
};

module.exports = {
  saveForm,
  getAllForms,
  getFormById,
  hasResponses,
  updateForm,
  deleteForm,
  duplicateForm,
};
