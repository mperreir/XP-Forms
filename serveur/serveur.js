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
    console.log("Données reçues pour enregistrement :", req.body); // <-- Debugging

    const { id, title, json_data } = req.body;

    if (!id || !title || !json_data) {
      return res.status(400).json({ error: "Tous les champs sont requis (id, title, json_data)" });
    }

    await db.query(
      'INSERT INTO forms (id, title, json_data) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, json_data = EXCLUDED.json_data, updated_at = NOW()',
      [id, title, JSON.stringify(json_data)]
    );

    res.status(201).json({ message: "Formulaire enregistré avec succès !" });
  } catch (err) {
    console.error("Erreur SQL :", err);
    res.status(500).json({ error: "Erreur lors de l'enregistrement du formulaire" });
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
    const result = await db.query('SELECT json_data, title FROM forms WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Formulaire non trouvé" });
    }

    const formData = result.rows[0].json_data;
    if (!formData || Object.keys(formData).length === 0) {
      return res.status(500).json({ error: "Le schéma du formulaire est vide ou invalide !" });
    }

    res.json({ json_data: formData, title: result.rows[0].title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération du formulaire" });
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


// Enregistrer les reponses d'un participant
app.post("/api/submit-form", async (req, res) => {
  const { form_id, user_id, responses } = req.body;

  try {
    // Étape 1 : Insérer la réponse dans `responses` et récupérer son ID
    const response = await db.query(
      "INSERT INTO responses (form_id, user_id) VALUES ($1, $2) RETURNING id",
      [form_id, user_id]
    );
    const response_id = response.rows[0].id; // `pg` stocke les résultats dans `rows`

    // Étape 2 : Insérer chaque réponse avec le `component_id` correct
    const queries = responses.map(({ component_id, value }) =>
      db.query(
        "INSERT INTO response_values (response_id, component_id, value) VALUES ($1, $2, $3)",
        [response_id, component_id, value]
      )
    );

    await Promise.all(queries); // Exécuter toutes les requêtes en parallèle

    res.status(200).json({ message: "Réponses enregistrées avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement des réponses:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// Récupérer les réponses d'un formulaire
app.get("/api/forms/:id/responses", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `SELECT r.id AS response_id, r.user_id, rv.component_id, rv.value 
       FROM responses r 
       JOIN response_values rv ON r.id = rv.response_id 
       WHERE r.form_id = $1 
       ORDER BY r.created_at DESC`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Aucune réponse trouvée pour ce formulaire" });
    }

    // Organiser les réponses par participant
    const groupedResponses = {};
    result.rows.forEach(row => {
      if (!groupedResponses[row.response_id]) {
        groupedResponses[row.response_id] = { user_id: row.user_id, responses: {} };
      }
      groupedResponses[row.response_id].responses[row.component_id] = row.value;
    });

    res.json(Object.values(groupedResponses));

  } catch (error) {
    console.error("Erreur lors de la récupération des réponses :", error);
    res.status(500).json({ error: "Erreur serveur" });
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
      return res.status(400).json({ error: "Impossible de supprimer ce formulaire car des réponses existent !" });
    }

    // Supprimer le formulaire si aucune réponse n'est associée
    const result = await db.query("DELETE FROM forms WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Formulaire non trouvé" });
    }

    res.json({ message: "Formulaire supprimé avec succès !" });

  } catch (err) {
    console.error("Erreur lors de la suppression :", err);
    res.status(500).json({ error: "Erreur lors de la suppression du formulaire" });
  }
});


app.listen(5000, () => {
  console.log("Server is running on port 5000");
});