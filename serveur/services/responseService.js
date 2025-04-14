const db = require("../base_de_donnee/db");

const submitForm = (form_id, user_id, responses) => {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id FROM responses WHERE form_id = ? AND user_id = ?",
      [form_id, user_id],
      (err, row) => {
        if (err) return reject(new Error("Erreur SQL : " + err.message));

        if (row) {
          const response_id = row.id;
          const updateOps = responses.map(({ component_id, value }) =>
            new Promise((res, rej) => {
              db.run(
                "UPDATE response_values SET value = ? WHERE response_id = ? AND component_id = ?",
                [value, response_id, component_id],
                err => (err ? rej(err) : res())
              );
            })
          );
          Promise.all(updateOps)
            .then(() => resolve("Réponses mises à jour avec succès."))
            .catch(err => reject(new Error("Erreur lors de la mise à jour : " + err.message)));
        } else {
          db.run(
            "INSERT INTO responses (form_id, user_id, submitted_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
            [form_id, user_id],
            function (err) {
              if (err) return reject(new Error("Erreur d'insertion de réponse : " + err.message));

              const response_id = this.lastID;
              const insertOps = responses.map(({ component_id, value }) =>
                new Promise((res, rej) => {
                  db.run(
                    "INSERT INTO response_values (response_id, component_id, value) VALUES (?, ?, ?)",
                    [response_id, component_id, value],
                    err => (err ? rej(err) : res())
                  );
                })
              );
              Promise.all(insertOps)
                .then(() => resolve("Réponses enregistrées avec succès."))
                .catch(err => reject(new Error("Erreur d'enregistrement des réponses : " + err.message)));
            }
          );
        }
      }
    );
  });
};

const saveResponse = (form_id, user_id, component_id, value) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id FROM response_values WHERE response_id IN (SELECT id FROM responses WHERE form_id = ? AND user_id = ?) AND component_id = ?`,
      [form_id, user_id, component_id],
      (err, existing) => {
        if (err) return reject(new Error("Erreur recherche réponse existante : " + err.message));

        if (existing) {
          db.run(
            "UPDATE response_values SET value = ? WHERE id = ?",
            [value, existing.id],
            err => (err ? reject(new Error("Erreur MAJ réponse : " + err.message)) : resolve("Réponse mise à jour."))
          );
        } else {
          db.get(
            "SELECT id FROM responses WHERE form_id = ? AND user_id = ?",
            [form_id, user_id],
            (err, responseRow) => {
              if (err) return reject(new Error("Erreur recherche responses : " + err.message));

              const insertValue = response_id => {
                db.run(
                  "INSERT INTO response_values (response_id, component_id, value) VALUES (?, ?, ?)",
                  [response_id, component_id, value],
                  err => (err ? reject(new Error("Erreur insert value : " + err.message)) : resolve("Réponse enregistrée."))
                );
              };

              if (responseRow) {
                insertValue(responseRow.id);
              } else {
                db.run(
                  "INSERT INTO responses (form_id, user_id) VALUES (?, ?)",
                  [form_id, user_id],
                  function (err) {
                    if (err) return reject(new Error("Erreur insert response : " + err.message));
                    insertValue(this.lastID);
                  }
                );
              }
            }
          );
        }
      }
    );
  });
};

const getResponses = form_id => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT r.id AS response_id, r.user_id, c.label AS question, rv.value AS answer
       FROM responses r
       JOIN response_values rv ON r.id = rv.response_id
       JOIN components c ON rv.component_id = c.id
       WHERE r.form_id = ?
       ORDER BY r.submitted_at DESC`,
      [form_id],
      (err, rows) => {
        if (err) return reject(new Error("Erreur récupération réponses : " + err.message));
        const grouped = {};
        rows.forEach(row => {
          if (!grouped[row.user_id]) grouped[row.user_id] = { user_id: row.user_id, responses: [] };
          grouped[row.user_id].responses.push({ question: row.question, answer: row.answer });
        });
        resolve(Object.values(grouped));
      }
    );
  });
};

module.exports = {
  submitForm,
  saveResponse,
  getResponses,
};
