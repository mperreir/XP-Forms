// Routes des réponses : associe chaque URL (et méthode HTTP) à une fonction du contrôleur
const express = require("express");
const router = express.Router();
const responseController = require("../controllers/responseController");

// Enregistre en une fois toutes les réponses d'un participant
router.post("/submit-form", responseController.submitForm);
// Enregistre une seule réponse (à chaque modification d'un champ)
router.post("/save-response", responseController.saveResponse);
// Toutes les réponses d'un formulaire, regroupées par participant
router.get("/forms/:id/responses", responseController.getResponses);
// Réponses d'un participant précis pour un formulaire (pré-remplissage)
router.get("/form-responses-participant/:form_id/:user_id", responseController.getParticipantResponses);
// Arrête le serveur
router.post("/shutdown", responseController.shutdown);
// Supprime toutes les réponses d'un formulaire (le formulaire est conservé)
router.delete("/forms/:id/responses", responseController.deleteFormResponses);



module.exports = router;