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
  }
});



app.listen(5000, () => {
  console.log("Server is running on port 5000");
});