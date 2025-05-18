const db = require("../base_de_donnee/db");
const { exec } = require('child_process');

const submitForm = (form_id, user_id, responses) => {
  return new Promise((resolve, reject) => {
    const ops = responses.map(({ component_id, value }) =>
      new Promise((res, rej) => {
        db.run(
          `
          INSERT INTO responses (form_id, component_id, user_id, value)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(form_id, component_id, user_id)
          DO UPDATE SET value = excluded.value, submitted_at = CURRENT_TIMESTAMP
          `,
          [form_id, component_id, user_id, value],
          (err) => (err ? rej(err) : res())
        );
      })
    );

    Promise.all(ops)
      .then(() => resolve("Réponses enregistrées ou mises à jour avec succès."))
      .catch((err) => reject(new Error("Erreur lors de la sauvegarde des réponses : " + err.message)));
  });
};


const saveResponse = (form_id, user_id, component_id, value) => {
  return new Promise((resolve, reject) => {
    // Check if the component is a checklist and handle accordingly
    db.get("SELECT type FROM components WHERE id = ?", [component_id], (err, row) => {
      if (err) {
        return reject(new Error("Erreur lors de la vérification du type de composant : " + err.message));
      }
      
      // Properly format checklist values as comma-separated strings
      let formattedValue = value;
      if (row && row.type === "checklist" && Array.isArray(value)) {
        formattedValue = value.join(",");
      }
      
      db.run(
        `
        INSERT INTO responses (form_id, component_id, user_id, value)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(form_id, component_id, user_id) DO UPDATE SET value = excluded.value, submitted_at = CURRENT_TIMESTAMP
        `,
        [form_id, component_id, user_id, formattedValue],
        function (err) {
          if (err) {
            reject(new Error("Erreur lors de l'insertion ou mise à jour de la réponse : " + err.message));
          } else {
            resolve("Réponse enregistrée ou mise à jour.");
          }
        }
      );
    });
  });
};



const getResponses = (form_id) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT r.user_id, c.label AS question, r.value AS answer
       FROM responses r
       JOIN components c ON r.component_id = c.id
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


const getParticipantResponses = (form_id, user_id) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT c.key_name AS component_key, r.value AS value
       FROM responses r
       JOIN components c ON r.component_id = c.id
       WHERE r.form_id = ? AND r.user_id = ?`,
      [form_id, user_id],
      (err, rows) => {
        if (err) return reject(new Error("Erreur récupération des réponses du participant : " + err.message));
        resolve(rows);
      }
    );
  });
};

const shutdownServer = (req, res) => {
  // Using exec to run the shutdown command
  exec('taskkill /FI "WINDOWTITLE eq React App*" /F', (err, stdout, stderr) => {
    if (err) {
      console.error('Shutdown failed:', stderr);
      return res.status(500).json({ error: 'Failed to shutdown server.' });
    }
    console.log('Shutdown success:', stdout);
    res.status(200).json({ message: 'Server shutting down...' });
  });
};

const deleteResponsesByFormId = (formId) => {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM responses WHERE form_id = ?", [formId], function (err) {
      if (err) {
        console.error("Erreur SQL lors de la suppression des réponses :", err);
        reject(err);
      } else {
        resolve({ message: "Toutes les réponses du formulaire ont été supprimées." });
      }
    });
  });
};

module.exports = {
  submitForm,
  saveResponse,
  getResponses,
  getParticipantResponses,
  shutdownServer,
  deleteResponsesByFormId,
};
