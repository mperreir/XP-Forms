const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const formRoutes = require('./routes/formRoutes');
const responseRoutes = require("./routes/responseRoutes");

const cors = require("cors");
app.use(cors());



app.use(express.json()); // Middleware for JSON
app.use(bodyParser.json());

// Use form routes
app.use('/api', formRoutes);
app.use("/api", responseRoutes);
/*
app.post('/api/save-form', async (req, res) => {
  try {
    const { id, title, json_data } = req.body;
    const components = json_data.components || [];

    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error("Erreur début de transaction", err.message);
        return res.status(500).send("Erreur serveur");
      }

      // Insérer le formulaire
      db.run(
        'INSERT INTO forms (id, title, json_data) VALUES (?, ?, ?)',
        [id, title, JSON.stringify(json_data)],
        (err) => {
          if (err) {
            console.error("Erreur lors de l'insertion du formulaire", err.message);
            db.run('ROLLBACK');
            return res.status(500).send("Erreur lors de l'insertion du formulaire");
          }

          // Insérer les composants
          components.forEach(component => {
            db.run(
              'INSERT INTO components (id, form_id, label, type, key_name, layout) VALUES (?, ?, ?, ?, ?, ?)',
              [component.id, id, component.label || '', component.type, component.key || '', JSON.stringify(component.layout)],
              (err) => {
                if (err) {
                  console.error("Erreur lors de l'insertion du composant", err.message);
                  db.run('ROLLBACK');
                  return res.status(500).send("Erreur lors de l'insertion du composant");
                }
              }
            );
          });

          db.run('COMMIT', (err) => {
            if (err) {
              console.error("Erreur lors de la validation de la transaction", err.message);
              return res.status(500).send("Erreur serveur");
            }
            res.status(201).json({ message: "Formulaire et composants enregistrés !" });
          });
        }
      );
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de l'enregistrement du formulaire");
  }
});
*/




// Récupérer tous les formulaires
/*
app.get('/api/forms', async (req, res) => {
  try {
    db.all('SELECT id, title, created_at, updated_at FROM forms ORDER BY created_at DESC', (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erreur lors de la récupération des formulaires");
      }
      res.json(rows);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la récupération des formulaires");
  }
});*/
/*
// Recuperer le schema du formulaire correspondant à l'id fournis
app.get("/api/forms/:id", async (req, res) => {
  const { id } = req.params;

  try {
    db.get(
      "SELECT id, json_data, created_at FROM forms WHERE id = ?",
      [id],
      (err, row) => {
        if (err) {
          console.error("Error fetching form:", err);
          return res.status(500).send("Erreur lors de la récupération du formulaire");
        }

        if (!row) {
          return res.status(404).json({ error: "Formulaire non trouvé" });
        }

        // Ensure json_data is parsed and check if components exist
        try {
          const jsonData = JSON.parse(row.json_data);
          if (!jsonData || !jsonData.components) {
            return res.status(500).json({ error: "Le formulaire ne contient pas de composants valides." });
          }
          res.json({ id: row.id, json_data: jsonData, created_at: row.created_at });
        } catch (err) {
          console.error("Error parsing json_data:", err);
          return res.status(500).json({ error: "Erreur lors du traitement du schéma du formulaire" });
        }
      }
    );
  } catch (err) {
    console.error("Error handling the request:", err);
    res.status(500).send("Erreur lors de la récupération du formulaire");
  }
});
*/


/*
app.get("/api/forms/:id/has-responses", async (req, res) => {
  const { id } = req.params;

  try {
    db.get(
      "SELECT COUNT(*) AS total FROM responses WHERE form_id = ?",
      [id],
      (err, row) => {
        if (err) {
          console.error("Erreur SQL :", err);
          return res.status(500).json({ error: "Erreur serveur" });
        }
        const hasResponses = parseInt(row.total) > 0;
        res.json({ hasResponses });
      }
    );
  } catch (error) {
    console.error("Erreur SQL :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
*/

/*
app.put('/api/forms/:id', async (req, res) => {
  const { id } = req.params;
  const { title, json_data } = req.body;

  try {
    db.run(
      'UPDATE forms SET title = ?, json_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, JSON.stringify(json_data), id],
      function(err) {
        if (err) {
          console.error(err);
          return res.status(500).send("Erreur lors de la mise à jour du formulaire");
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: "Formulaire non trouvé" });
        }
        res.json({ message: "Formulaire mis à jour avec succès !" });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la mise à jour du formulaire");
  }
});

*/

/*

// Enregistrer une fois pour toute les réponses d'un participant lorsqu'il clique sur submit
app.post("/api/submit-form", async (req, res) => {
  const { form_id, user_id, responses } = req.body;

  try {
    if (!responses || responses.length === 0) {
      return res.status(400).json({ error: "Aucune réponse à enregistrer." });
    }

    db.get(
      "SELECT id FROM responses WHERE form_id = ? AND user_id = ?",
      [form_id, user_id],
      (err, row) => {
        if (err) {
          console.error("Erreur SQL :", err);
          return res.status(500).json({ error: "Erreur serveur" });
        }

        let response_id;

        if (row) {
          response_id = row.id;

          const updateQueries = responses.map(({ component_id, value }) =>
            db.run(
              "UPDATE response_values SET value = ? WHERE response_id = ? AND component_id = ?",
              [value, response_id, component_id]
            )
          );

          Promise.all(updateQueries)
            .then(() => res.status(200).json({ message: "Réponses mises à jour avec succès." }))
            .catch((error) => {
              console.error("Erreur lors de la mise à jour des réponses", error);
              res.status(500).json({ error: "Erreur serveur" });
            });

        } else {
          // Insérer les nouvelles réponses
          db.run(
            "INSERT INTO responses (form_id, user_id, submitted_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
            [form_id, user_id],
            function (err) {
              if (err) {
                console.error("Erreur lors de l'insertion de la réponse :", err);
                return res.status(500).json({ error: "Erreur serveur" });
              }
              response_id = this.lastID;

              const insertQueries = responses.map(({ component_id, value }) =>
                db.run(
                  "INSERT INTO response_values (response_id, component_id, value) VALUES (?, ?, ?)",
                  [response_id, component_id, value]
                )
              );

              Promise.all(insertQueries)
                .then(() => res.status(201).json({ message: "Réponses enregistrées avec succès." }))
                .catch((error) => {
                  console.error("Erreur lors de l'insertion des réponses", error);
                  res.status(500).json({ error: "Erreur serveur" });
                });
            }
          );
        }
      }
    );
  } catch (error) {
    console.error("Erreur dans /api/submit-form :", error.stack);
    res.status(500).json({ error: "Erreur serveur" });
  }
});




// Appelé dans le cas de l'auto-sauvegarde des réponses du participant au formulaire
app.post("/api/save-response", async (req, res) => {
  const { form_id, user_id, component_id, value } = req.body;

  try {
    // Vérifier si une réponse existe déjà pour ce participant et ce champ
    const queryExistingResponse = 'SELECT id FROM response_values WHERE response_id IN (SELECT id FROM responses WHERE form_id = ? AND user_id = ?) AND component_id = ?';
    db.get(queryExistingResponse, [form_id, user_id, component_id], (err, existingResponse) => {
      if (err) {
        console.error("Erreur lors de la vérification de la réponse existante :", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      if (existingResponse) {
        // Mise à jour de la réponse existante
        const queryUpdate = 'UPDATE response_values SET value = ? WHERE id = ?';
        db.run(queryUpdate, [value, existingResponse.id], (err) => {
          if (err) {
            console.error("Erreur lors de la mise à jour de la réponse :", err);
            return res.status(500).json({ error: "Erreur serveur" });
          }
          return res.json({ message: "Réponse mise à jour." });
        });
      } else {
        // Vérifier si une entrée existe déjà dans la table `responses`
        const queryResponseCheck = 'SELECT id FROM responses WHERE form_id = ? AND user_id = ?';
        db.get(queryResponseCheck, [form_id, user_id], (err, responseCheck) => {
          if (err) {
            console.error("Erreur lors de la vérification des réponses :", err);
            return res.status(500).json({ error: "Erreur serveur" });
          }

          let response_id;
          if (responseCheck) {
            response_id = responseCheck.id;
          } else {
            // Insérer une nouvelle réponse
            const queryInsertResponse = 'INSERT INTO responses (form_id, user_id) VALUES (?, ?) RETURNING id';
            db.run(queryInsertResponse, [form_id, user_id], function (err) {
              if (err) {
                console.error("Erreur lors de l'insertion de la réponse :", err);
                return res.status(500).json({ error: "Erreur serveur" });
              }
              response_id = this.lastID;
            });
          }

          // Insérer la nouvelle valeur
          const queryInsertResponseValue = 'INSERT INTO response_values (response_id, component_id, value) VALUES (?, ?, ?)';
          db.run(queryInsertResponseValue, [response_id, component_id, value], (err) => {
            if (err) {
              console.error("Erreur lors de l'insertion de la valeur de la réponse :", err);
              return res.status(500).json({ error: "Erreur serveur" });
            }
            return res.json({ message: "Réponse enregistrée." });
          });
        });
      }
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de la réponse :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});



app.get("/api/forms/:id/responses", async (req, res) => {
  const { id } = req.params;
  console.log("Récupération des réponses pour le formulaire ID:", id);

  try {
    db.all(
      `SELECT r.id AS response_id, r.user_id, c.label AS question, rv.value AS answer
       FROM responses r
       JOIN response_values rv ON r.id = rv.response_id
       JOIN components c ON rv.component_id = c.id
       WHERE r.form_id = ?
       ORDER BY r.submitted_at DESC`,
      [id],
      (err, rows) => {
        if (err) {
          console.error("Erreur SQL :", err);
          return res.status(500).json({ error: "Erreur serveur" });
        }

        if (rows.length === 0) {
          console.log("Aucune réponse trouvée.");
          return res.json([]); // Retourner un tableau vide
        }

        // Regrouper les réponses par utilisateur
        const groupedResponses = {};
        rows.forEach(row => {
          if (!groupedResponses[row.user_id]) {
            groupedResponses[row.user_id] = { user_id: row.user_id, responses: [] };
          }
          groupedResponses[row.user_id].responses.push({ question: row.question, answer: row.answer });
        });

        res.json(Object.values(groupedResponses));
      }
    );
  } catch (error) {
    console.error("Erreur SQL :", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des réponses" });
  }
});*/

/*
//
// modifer un formulaire
app.put('/api/forms/:id', async (req, res) => {
  const { id } = req.params;
  const { title, json_data } = req.body;

  try {
    // Update the form in the database
    db.run(
      'UPDATE forms SET title = ?, json_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, JSON.stringify(json_data), id],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: "Erreur lors de la mise à jour du formulaire" });
        }

        // Check if any rows were updated
        if (this.changes === 0) {
          return res.status(404).json({ error: "Formulaire non trouvé" });
        }

        res.json({ message: "Formulaire mis à jour avec succès !" });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});*/




//supprimer un formulaire
/*
app.delete('/api/forms/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Check if the form has any responses
    db.get("SELECT COUNT(*) AS total FROM responses WHERE form_id = ?", [id], (err, row) => {
      if (err) {
        console.error("Erreur SQL :", err);
        return res.status(500).json({ error: "Erreur serveur" });
      }

      // If there are responses, delete them first in a transaction
      if (parseInt(row.total) > 0) {
        db.run("BEGIN TRANSACTION", (err) => {
          if (err) {
            console.error("Erreur début de transaction", err.message);
            return res.status(500).send("Erreur serveur");
          }

          // Delete responses related to the form
          db.run("DELETE FROM response_values WHERE response_id IN (SELECT id FROM responses WHERE form_id = ?)", [id]);
          db.run("DELETE FROM responses WHERE form_id = ?", [id]);

          // Delete the form itself
          db.run("DELETE FROM forms WHERE id = ?", [id], (err) => {
            if (err) {
              console.error("Erreur lors de la suppression du formulaire", err);
              return res.status(500).json({ error: "Erreur lors de la suppression du formulaire" });
            }
            db.run("COMMIT", (err) => {
              if (err) {
                console.error("Erreur lors de la validation de la transaction", err.message);
                return res.status(500).send("Erreur serveur");
              }
              res.json({ message: "Formulaire et réponses supprimés avec succès !" });
            });
          });
        });
      } else {
        // If there are no responses, simply delete the form
        db.run("DELETE FROM forms WHERE id = ?", [id], (err) => {
          if (err) {
            console.error("Erreur lors de la suppression du formulaire", err);
            return res.status(500).json({ error: "Erreur lors de la suppression du formulaire" });
          }
          res.json({ message: "Formulaire supprimé avec succès !" });
        });
      }
    });
  } catch (err) {
    console.error("Erreur lors de la suppression :", err);
    res.status(500).json({ error: "Erreur lors de la suppression du formulaire" });
  }
});
*/

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});