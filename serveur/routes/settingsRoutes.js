// Routes des paramètres : associe chaque URL (et méthode HTTP) à une fonction du contrôleur
const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");

// Récupère l'id participant par défaut
router.get("/default-user-id", settingsController.getDefaultUserId);
// Enregistre l'id participant par défaut
router.post("/default-user-id", settingsController.setDefaultUserId);

module.exports = router;