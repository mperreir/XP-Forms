// Point d'entrée du serveur : configure Express, branche les routes de l'API
// et sert l'application React une fois compilée
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
// Fichiers de routes, un par thème
const formRoutes = require('./routes/formRoutes');
const responseRoutes = require("./routes/responseRoutes");
const groupRoutes = require("./routes/groupRoutes");
const defaultUserIdRoutes = require("./routes/settingsRoutes");

// CORS : autorise les requêtes venant d'une autre origine (utile en développement,
// quand React tourne sur un autre port que le serveur)
const cors = require("cors");
app.use(cors());

// Sert les images du dossier public du client à l'adresse /images
const path = require('path');
app.use('/images', express.static(path.join(__dirname, '../client/public/images')));

// Lecture du corps des requêtes au format JSON
app.use(express.json()); // Middleware for JSON
app.use(bodyParser.json());

// Use form routes
// Toutes les routes de l'API sont préfixées par /api
app.use('/api', formRoutes);
app.use("/api", responseRoutes);
app.use("/api", groupRoutes);
app.use('/api', defaultUserIdRoutes);

// servir le build React
// Fichiers statiques de l'application compilée (npm run build)
app.use(express.static(path.join(__dirname, "../client/build")));

// Toute autre URL renvoie index.html, pour que React Router gère les pages côté navigateur
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});


// Démarrage du serveur sur le port défini par l'environnement, ou 3001 par défaut
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});