const express = require("express");
const cors = require("cors"); // Permet d'accepter les requêtes de React
const db = require("./db");
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(express.json()); // Middleware pour traiter les JSON
app.use(bodyParser.json());


// Enregistrer un formulaire et ses composantes
app.post('/api/save-form', async (req, res) => {
  try {
    const { id, title, json_data } = req.body;
    const components = json_data.components || [];

    await db.query('BEGIN'); // Début de la transaction

    // Insérer le formulaire
    await db.query(
      'INSERT INTO forms (id, title, json_data) VALUES ($1, $2, $3)',
      [id, title, JSON.stringify(json_data)]
    );

    // Insérer les composants
    for (const component of components) {
      await db.query(
        'INSERT INTO components (id, form_id, label, type, key_name, layout) VALUES ($1, $2, $3, $4, $5, $6)',
        [component.id, id, component.label || '', component.type, component.key || '', JSON.stringify(component.layout)]
      );
    }

    await db.query('COMMIT'); // Valider la transaction

    res.status(201).json({ message: 'Formulaire et composants enregistrés !' });
  } catch (err) {
    await db.query('ROLLBACK'); // Annuler la transaction en cas d'erreur
    console.error(err);
    res.status(500).send('Erreur lors de l\'enregistrement du formulaire');
  }
});





// Récupérer tous les formulaires
app.get('/api/forms', async (req, res) => {
  try {
    const result = await db.query('SELECT id, title, created_at, updated_at FROM forms ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la récupération des formulaires");
  }
});

// Recuperer le schema du formulaire correspondant à l'id fournis
app.get('/api/forms/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT id, json_data, created_at FROM forms WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Formulaire non trouvé" });
    }

    const formData = result.rows[0].json_data;
    if (!formData || Object.keys(formData).length === 0) {
      return res.status(500).json({ error: "Le schéma du formulaire est vide ou invalide !" });
    }

    res.json({ id: result.rows[0].id, json_data: result.rows[0].json_data, created_at: result.rows[0].created_at, title: result.rows[0].title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération du formulaire" });
  }
});


app.get("/api/forms/:id/has-responses", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      "SELECT COUNT(*) AS total FROM responses WHERE form_id = $1",
      [id]
    );

    const hasResponses = parseInt(result.rows[0].total) > 0;
    res.json({ hasResponses });

  } catch (error) {
    console.error("Erreur SQL :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


app.put('/api/forms/:id', async (req, res) => {
  const { id } = req.params;
  const { title, json_data } = req.body;

  try {
    const result = await db.query(
      'UPDATE forms SET title = $1, json_data = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [title, JSON.stringify(json_data), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Formulaire non trouvé" });
    }

    res.json({ message: "Formulaire mis à jour avec succès !" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la mise à jour du formulaire");
    app.get("/api/forms/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const result = await db.query("SELECT id, json_data, created_at FROM forms WHERE id = $1", [id]);
        if (result.rows.length === 0) {
          return res.status(404).json({ error: "Formulaire non trouvé" });
        }
        res.json(result.rows[0]);
      } catch (err) {
        console.error(err);
        res.status(500).send("Erreur lors de la récupération du formulaire");
      }
    });
  }
});



// Enregistrer une fois pour toute les réponses d'un participant lorsqu'il clique sur submit
app.post("/api/submit-form", async (req, res) => {
  const { form_id, user_id, responses } = req.body;

  try {
    if (!responses || responses.length === 0) {
      return res.status(400).json({ error: "Aucune réponse à enregistrer." });
    }

    // Vérifie si une réponse existe déjà
    const responseCheck = await db.query(
      "SELECT id FROM responses WHERE form_id = $1 AND user_id = $2",
      [form_id, user_id]
    );

    let response_id;

    if (responseCheck.rows.length > 0) {
      // Mise à jour
      response_id = responseCheck.rows[0].id;

      const updateQueries = responses.map(({ component_id, value }) =>
        db.query(
          "UPDATE response_values SET value = $1 WHERE response_id = $2 AND component_id = $3",
          [value, response_id, component_id]
        )
      );

      await Promise.all(updateQueries);

      return res.status(200).json({ message: "Réponses mises à jour avec succès." });

    } else {
      // Insertion
      const insertResponse = await db.query(
        "INSERT INTO responses (form_id, user_id, submitted_at) VALUES ($1, $2, NOW()) RETURNING id",
        [form_id, user_id]
      );

      response_id = insertResponse.rows[0].id;

      const insertQueries = responses.map(({ component_id, value }) =>
        db.query(
          "INSERT INTO response_values (response_id, component_id, value) VALUES ($1, $2, $3)",
          [response_id, component_id, value]
        )
      );

      await Promise.all(insertQueries);

      return res.status(201).json({ message: "Réponses enregistrées avec succès." });
    }

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
    const existingResponse = await db.query(
      "SELECT id FROM response_values WHERE response_id IN (SELECT id FROM responses WHERE form_id = $1 AND user_id = $2) AND component_id = $3",
      [form_id, user_id, component_id]
    );

    if (existingResponse.rows.length > 0) {
      // Mise à jour de la réponse existante
      await db.query(
        "UPDATE response_values SET value = $1 WHERE id = $2",
        [value, existingResponse.rows[0].id]
      );
      return res.json({ message: "Réponse mise à jour." });
    } else {
      // Vérifier si une entrée existe déjà dans la table `responses`
      const responseCheck = await db.query(
        "SELECT id FROM responses WHERE form_id = $1 AND user_id = $2",
        [form_id, user_id]
      );

      let response_id;
      if (responseCheck.rows.length > 0) {
        response_id = responseCheck.rows[0].id;
      } else {
        // Insérer une nouvelle réponse
        const responseInsert = await db.query(
          "INSERT INTO responses (form_id, user_id) VALUES ($1, $2) RETURNING id",
          [form_id, user_id]
        );
        response_id = responseInsert.rows[0].id;
      }

      // Insérer la nouvelle valeur
      await db.query(
        "INSERT INTO response_values (response_id, component_id, value) VALUES ($1, $2, $3)",
        [response_id, component_id, value]
      );
      return res.json({ message: "Réponse enregistrée." });
    }
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de la réponse :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


app.get("/api/forms/:id/responses", async (req, res) => {
  const { id } = req.params;
  console.log("Récupération des réponses pour le formulaire ID:", id);

  try {
    const result = await db.query(
      `SELECT r.id AS response_id, r.user_id, c.label AS question, rv.value AS answer
       FROM responses r
       JOIN response_values rv ON r.id = rv.response_id
       JOIN components c ON rv.component_id = c.id
       WHERE r.form_id = $1
       ORDER BY r.submitted_at DESC`,
      [id]
    );

    console.log("Résultats SQL :", result.rows);

    if (result.rows.length === 0) {
      console.log("Aucune réponse trouvée.");
      return res.json([]); // Retourner un tableau vide
    }

    // Regrouper les réponses par utilisateur
    const groupedResponses = {};
    result.rows.forEach(row => {
      if (!groupedResponses[row.user_id]) {
        groupedResponses[row.user_id] = { user_id: row.user_id, responses: [] };
      }
      groupedResponses[row.user_id].responses.push({ question: row.question, answer: row.answer });
    });

    res.json(Object.values(groupedResponses));

  } catch (error) {
    console.error("Erreur SQL :", error);
    res.status(500).json({ error: "Erreur serveur lors de la récupération des réponses" });
  }
});




// modifer un formulaire
app.put('/api/forms/:id', async (req, res) => {
  const { id } = req.params;
  const { title, json_data } = req.body;

  try {
    const result = await db.query(
      'UPDATE forms SET title = $1, json_data = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [title, JSON.stringify(json_data), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Formulaire non trouvé" });
    }

    res.json({ message: "Formulaire mis à jour avec succès !" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la mise à jour du formulaire" });
  }
});



//supprimer un formulaire

app.delete('/api/forms/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Vérifier si des réponses existent pour ce formulaire
    const responseCheck = await db.query("SELECT COUNT(*) FROM responses WHERE form_id = $1", [id]);

    if (parseInt(responseCheck.rows[0].count) > 0) {
      const confirmDelete = true; // Ici, on doit gérer la confirmation côté frontend
      if (!confirmDelete) {
        return res.status(400).json({ error: "Annulation de la suppression." });
      }

      await db.query("BEGIN"); // Démarrer une transaction

      // Supprimer les réponses associées
      await db.query("DELETE FROM response_values WHERE response_id IN (SELECT id FROM responses WHERE form_id = $1)", [id]);
      await db.query("DELETE FROM responses WHERE form_id = $1", [id]);

      await db.query("COMMIT"); // Valider la transaction
    }

    // Supprimer le formulaire
    const result = await db.query("DELETE FROM forms WHERE id = $1 RETURNING *", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Formulaire non trouvé" });
    }

    res.json({ message: "Formulaire et réponses supprimés avec succès !" });

  } catch (err) {
    await db.query("ROLLBACK"); // Annuler en cas d’erreur
    console.error(" Erreur lors de la suppression :", err);
    res.status(500).json({ error: "Erreur lors de la suppression du formulaire" });
  }
});


app.listen(5000, () => {
  console.log("Server is running on port 5000");
});