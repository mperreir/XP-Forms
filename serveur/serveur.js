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
    const result = await db.query('SELECT json_data FROM forms WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Formulaire non trouvé" });
    }
    res.json(result.rows[0].json_data); // Renvoyer directement le contenu JSON
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la récupération du formulaire");
  }
});


app.listen(5000, () => {
  console.log("Server is running on port 5000");
});