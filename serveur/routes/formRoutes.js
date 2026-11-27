// Routes des formulaires : associe chaque URL (et méthode HTTP) à une fonction du contrôleur
const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");

// Enregistre un nouveau formulaire
router.post("/save-form", formController.saveForm);
// Liste de tous les formulaires
router.get("/forms", formController.getAllForms);
// Un formulaire à partir de son id
router.get("/forms/:id", formController.getFormById);
// Indique si le formulaire a déjà des réponses
router.get("/forms/:id/has-responses", formController.hasResponses);
// Met à jour un formulaire
router.put("/forms/:id", formController.updateForm);
// Déplace un formulaire dans un groupe
router.put("/forms/:id/move", formController.moveForm);
// Supprime un formulaire
router.delete("/forms/:id", formController.deleteForm);
// Duplique un formulaire
router.post("/forms/:id/duplicate", formController.duplicateForm);
// Exporte un formulaire (":responses" = true/false pour inclure ou non les réponses)
router.get("/forms/:id/export/:responses", formController.exportForm);
// Importe un formulaire depuis un JSON
router.post("/import-form", formController.importForm);


module.exports = router;