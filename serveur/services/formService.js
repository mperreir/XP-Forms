// Service des formulaires : toute la logique métier et l'accès à la base de données (SQLite)
// pour les formulaires et leurs composants. Appelé par formController.
require("../base_de_donnee/initDb.js"); // s'assure que la base et les tables existent
const { json } = require("express");
const db = require("../base_de_donnee/db");
const { v4: uuidv4 } = require('uuid');

// Met à plat tous les composants d'un schéma, y compris ceux imbriqués dans des groupes ou des colonnes
const flattenComponents = (components) => {
  const flat = [];

  const recurse = (comps) => {
    comps.forEach((c) => {
      flat.push(c);
      // Composants enfants (groupes, etc.)
      if (Array.isArray(c.components)) {
        recurse(c.components);
      }
      // Composants placés dans des colonnes
      if (Array.isArray(c.columns)) {
        c.columns.forEach((col) => {
          if (Array.isArray(col.components)) {
            recurse(col.components);
          }
        });
      }
    });
  };

  recurse(components);
  return flat;
};

// Enregistre un nouveau formulaire et chacun de ses composants, dans une transaction
const saveForm = (id, title, json_data, group_id = null) => {
  return new Promise((resolve, reject) => {
    const components = json_data.components || [];
    const flatComponents = flattenComponents(components);
    db.run("BEGIN TRANSACTION", (err) => {
      if (err) return reject(err);

      // 1. Insertion du formulaire lui-même (schéma stocké en JSON)
      db.run(
        "INSERT INTO forms (id, title, json_data, group_id) VALUES (?, ?, ?, ?)",
        [id, title, JSON.stringify(json_data), group_id],
        (err) => {
          if (err) {
            db.run("ROLLBACK");
            return reject(err);
          }

          // 2. Insertion de chaque composant (liste à plat)
          // boucle sur tous les composants flattenés
          let hasError = false;
          flatComponents.forEach((c) => {
            if (hasError) return;

            const label = c.label || c.dateLabel || "";
            db.run(
              "INSERT INTO components (id, form_id, label, type, key_name, layout) VALUES (?, ?, ?, ?, ?, ?)",
              [c.id, id, label, c.type, c.key || "", JSON.stringify(c.layout)],
              (err) => {
                if (err) {
                  hasError = true;
                  db.run("ROLLBACK");
                  return reject(err);
                }
              }
            );
          });
          // 3. Validation de la transaction
          db.run("COMMIT", (err) => {
            if (err) return reject(err);
            resolve("Formulaire et composants enregistrés !");
          });
        }
      );
    });
  });
};

// Renvoie tous les formulaires, avec le nom de leur groupe (s'ils en ont un)
const getAllForms = () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT forms.*, groups.name AS group_name
       FROM forms
       LEFT JOIN groups ON forms.group_id = groups.id`,
      [],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
};


// Renvoie un formulaire (schéma déjà converti de JSON en objet) ou une erreur "non trouvé"
const getFormById = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT id, json_data, created_at, title FROM forms WHERE id = ?", [id], (err, row) => {
      if (err) return reject(err);
      if (!row) return reject(new Error("Formulaire non trouvé"));

      try {
        const jsonData = JSON.parse(row.json_data);
        // Un schéma sans composants est considéré comme invalide
        if (!jsonData || !jsonData.components) {
          return reject(new Error("Le formulaire ne contient pas de composants valides."));
        }
        resolve({ id: row.id, json_data: jsonData, created_at: row.created_at, title: row.title });
      } catch (e) {
        reject(new Error("Erreur lors du traitement du schéma du formulaire"));
      }
    });
  });
};

// Indique si au moins une réponse existe pour ce formulaire
const hasResponses = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT COUNT(*) AS total FROM responses WHERE form_id = ?", [id], (err, row) => {
      if (err) return reject(err);
      resolve(parseInt(row.total) > 0);
    });
  });
};

// Met à jour un formulaire : on remplace son schéma, puis on recrée tous ses composants
const updateForm = (id, title, json_data) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // 1. Mettre à jour le formulaire
      db.run(
        "UPDATE forms SET title = ?, json_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [title, JSON.stringify(json_data), id],
        function (err) {
          if (err) {
            db.run("ROLLBACK");
            return reject(err);
          }

          // 2. Supprimer les anciens composants
          db.run("DELETE FROM components WHERE form_id = ?", [id], async (err) => {
            if (err) {
              db.run("ROLLBACK");
              return reject(err);
            }

            try {
              // 3. Flatten + validation
              const components = json_data.components || [];
              const flatComponents = flattenComponents(components);

              // Vérifier unicité des IDs
              const ids = flatComponents.map(c => c.id);
              const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
              if (duplicateIds.length > 0) {
                db.run("ROLLBACK");
                return reject(new Error("Doublons détectés dans les IDs : " + duplicateIds.join(", ")));
              }
              console.log(ids);

              // 4. Insérer les nouveaux composants
              // (un par un : on attend chaque insertion avant de passer à la suivante)
              for (const c of flatComponents) {
                const label = c.label || c.dateLabel || "";
                await new Promise((res, rej) => {
                  db.run(
                    "INSERT INTO components (id, form_id, label, type, key_name, layout) VALUES (?, ?, ?, ?, ?, ?)",
                    [
                      c.id,
                      id,
                      label,
                      c.type || "text",
                      c.key || "",
                      JSON.stringify(c.layout || {})
                    ],
                    (err) => {
                      if (err) return rej(err);
                      res();
                    }
                  );
                });
              }

              // 5. Commit
              db.run("COMMIT", (err) => {
                if (err) {
                  db.run("ROLLBACK");
                  return reject(err);
                }
                resolve(1); // Succès
              });
            } catch (e) {
              db.run("ROLLBACK");
              reject(e);
            }
          });
        }
      );
    });
  });
};




// Supprime un formulaire ; s'il a des réponses, elles sont supprimées avec lui (dans une transaction)
const deleteForm = (id) => {
  return new Promise((resolve, reject) => {
    db.get("SELECT COUNT(*) AS total FROM responses WHERE form_id = ?", [id], (err, row) => {
      if (err) return reject(err);

      const total = parseInt(row.total);
      if (total > 0) {
        // Avec des réponses : on supprime d'abord les réponses, puis le formulaire
        db.run("BEGIN TRANSACTION", (err) => {
          if (err) return reject(err);

          db.run("DELETE FROM responses WHERE form_id = ?", [id], (err) => {
            if (err) return reject(err);

            db.run("DELETE FROM forms WHERE id = ?", [id], (err) => {
              if (err) return reject(err);

              db.run("COMMIT", (err) => {
                if (err) return reject(err);
                resolve("Formulaire et réponses supprimés avec succès !");
              });
            });
          });
        });
      } else {
        // Sans réponse : suppression directe
        db.run("DELETE FROM forms WHERE id = ?", [id], (err) => {
          if (err) return reject(err);
          resolve("Formulaire supprimé avec succès !");
        });
      }
    });
  });
};


// Service function to duplicate a form
// Duplique un formulaire : nouveaux ids pour le formulaire et tous ses composants, titre suffixé "(copy)"
const duplicateForm = async (formId, newgroupId = null) => {
  return new Promise((resolve, reject) => {
    db.run("BEGIN TRANSACTION");

    db.get("SELECT * FROM forms WHERE id = ?", [formId], (err, form) => {
      if (err || !form) {
        db.run("ROLLBACK");
        return reject({ success: false, error: err ? err.message : "Formulaire introuvable" });
      }

      const oldJson = JSON.parse(form.json_data);
      // Table de correspondance : ancien id de composant -> nouvel id
      const componentIdMap = {};

      function cloneComponentWithNewIds(component) { // Cloner récursivement les components
        const newId = `Comp_${uuidv4().slice(0, 8)}`;
        componentIdMap[component.id] = newId;

        let clonedChildren = undefined;
        if (component.components && Array.isArray(component.components)) {
          clonedChildren = component.components.map(cloneComponentWithNewIds);
        }

        return {
          ...component,
          id: newId,
          ...(clonedChildren ? { components: clonedChildren } : {})
        };
      }

      const oldComponents = oldJson.components || [];

      // Copie du schéma avec de nouveaux ids pour tous les composants
      const newComponents = oldComponents.map(cloneComponentWithNewIds);

      const newFormJson = {
        ...oldJson,
        components: newComponents
      };

      // Générer un ID de formulaire unique
      // (on retente tant que l'id tiré au hasard existe déjà en base)
      const generateUniqueFormId = () => {
        return new Promise((resolve, reject) => {
          const tryGenerate = () => {
            const newId = `Form_${Math.random().toString(36).slice(2, 10)}`;
            db.get("SELECT id FROM forms WHERE id = ?", [newId], (err, row) => {
              if (err) return reject(err);
              if (row) return tryGenerate();
              resolve(newId);
            });
          };
          tryGenerate();
        });
      };

      generateUniqueFormId()
        .then((newFormId) => {
          const newTitle = `${form.title} (copy)`;
          const jsonDataString = JSON.stringify(newFormJson);

          // Insertion de la copie du formulaire (même groupe que l'original par défaut)
          db.run(
            "INSERT INTO forms (id, title, json_data, group_id, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
            [newFormId, newTitle, jsonDataString, newgroupId ?? form.group_id],
            (err) => {
              if (err) {
                db.run("ROLLBACK");
                return reject({ success: false, error: err.message });
              }

              // On recopie les lignes de la table "components" avec les nouveaux ids
              db.all("SELECT * FROM components WHERE form_id = ?", [formId], (err, components) => {
                if (err) {
                  db.run("ROLLBACK");
                  return reject({ success: false, error: err.message });
                }

                const insertTasks = components.map((comp) => {
                  const newId = componentIdMap[comp.id];
                  return new Promise((res, rej) => {
                    db.run(
                      "INSERT INTO components (id, form_id, label, type, action, key_name, layout) VALUES (?, ?, ?, ?, ?, ?, ?)",
                      [
                        newId,
                        newFormId,
                        comp.label,
                        comp.type,
                        comp.action,
                        comp.key_name,
                        comp.layout
                      ],
                      (err) => {
                        if (err) return rej(err);
                        res();
                      }
                    );
                  });
                });

                // Quand toutes les insertions sont terminées, on valide la transaction
                Promise.all(insertTasks)
                  .then(() => {
                    db.run("COMMIT", (err) => {
                      if (err) {
                        db.run("ROLLBACK");
                        return reject({ success: false, error: err.message });
                      }
                      resolve({ success: true, newFormId });
                    });
                  })
                  .catch((error) => {
                    db.run("ROLLBACK");
                    reject({ success: false, error: error.message });
                  });
              });
            }
          );
        })
        .catch((error) => {
          db.run("ROLLBACK");
          reject({ success: false, error: error.message });
        });
    });
  });
};

// Exporte un formulaire (titre + schéma), avec ses réponses regroupées par participant si demandé
const exportForm = async (formId, withResponses) => {
  return new Promise((resolve, reject) => {

    db.get("SELECT * FROM forms WHERE id = ?", [formId], (err, form) => {
      if (err) {
        return reject({ success: false, error: err ? err.message : "Formulaire introuvable" });
      }

      const formName = form.title;
      const formJson = JSON.parse(form.json_data);

      // Le paramètre arrive depuis l'URL, donc sous forme de texte : 'true' ou 'false'
      if (withResponses === 'true') {

        db.all("SELECT * FROM responses WHERE form_id = ?", [formId], (err, resp) => {
          if (err) {
            return reject({ success: false, error: err ? err.message : "Formulaire introuvable" });
          }

          // Regroupement des réponses par participant : { user_id: [réponses...] }
          const data = resp;
          const responsesJson = {};
          data.forEach((item) => {
            const user_id = item.user_id;
            if (!responsesJson[user_id]) responsesJson[user_id] = [];
            responsesJson[user_id].push(item);
          });

          resolve({ "title": formName, "json_data": formJson, "responses": responsesJson });
        });

      }
      else {

        // Export sans les réponses
        resolve({ "title": formName, "json_data": formJson, "responses": [] });

      }

    });
  });
};

// Change le groupe d'un formulaire (group_id à null pour le retirer de son groupe)
const moveForm = (id, group_id) => {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE forms SET group_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [group_id, id],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

// Enregistre l'id participant par défaut d'un formulaire (met à jour s'il existe déjà)
exports.setDefaultUserId = (form_id, default_user_id) => {
  return new Promise((resolve, reject) => {
    db.run(
      `
      INSERT INTO default_user_ids (form_id, default_user_id)
      VALUES (?, ?)
      ON CONFLICT(form_id) DO UPDATE SET default_user_id = excluded.default_user_id
      `,
      [form_id, default_user_id],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

// Renvoie l'id participant par défaut d'un formulaire (null s'il n'y en a pas)
exports.getDefaultUserId = (form_id) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT default_user_id FROM default_user_ids WHERE form_id = ?`,
      [form_id],
      (err, row) => {
        if (err) return reject(err);
        resolve(row ? row.default_user_id : null);
      }
    );
  });
};

// Fonctions exposées au contrôleur
module.exports = {
  saveForm,
  getAllForms,
  getFormById,
  hasResponses,
  updateForm,
  deleteForm,
  duplicateForm,
  moveForm,
  exportForm,
};