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



app.listen(5000, () => {
  console.log("Server is running on port 5000");
});