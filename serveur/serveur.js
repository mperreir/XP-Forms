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


// Enregistrer une fois pour toute les réponses d'un participant lorsqu'il clique sur submit
app.post("/api/submit-form", async (req, res) => {
  const { form_id, user_id, responses } = req.body;

  try {
    // Vérifier que `responses` n'est pas vide
    if (!responses || responses.length === 0) {
      return res.status(400).json({ error: "Aucune réponse à mettre à jour." });
    }

    // Récupérer l'ID de la réponse existante dans `responses`
    const responseCheck = await db.query(
      "SELECT id FROM responses WHERE form_id = $1 AND user_id = $2",
      [form_id, user_id]
    );

    if (responseCheck.rows.length === 0) {
      return res.status(400).json({ error: "Aucune réponse existante trouvée pour ce formulaire." });
    }

    const response_id = responseCheck.rows[0].id;

    // Mise à jour de chaque valeur dans `response_values`
    const updateQueries = responses.map(({ component_id, value }) =>
      db.query(
        "UPDATE response_values SET value = $1 WHERE response_id = $2 AND component_id = $3",
        [value, response_id, component_id]
      )
    );

    await Promise.all(updateQueries); // Exécuter toutes les requêtes en parallèle

    res.status(200).json({ message: "Réponses mises à jour avec succès." });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des réponses:", error);
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




app.listen(5000, () => {
  console.log("Server is running on port 5000");
});