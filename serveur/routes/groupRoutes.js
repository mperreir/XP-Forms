// Routes des groupes : associe chaque URL (et méthode HTTP) à une fonction du contrôleur
const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");

// Crée un groupe
router.post("/groups", groupController.creategroup);
// Liste de tous les groupes
router.get("/groups", groupController.getAllgroups);
// Un groupe à partir de son id
router.get("/groups/:id", groupController.getgroupById);
// Renomme un groupe
router.put("/groups/:id", groupController.renamegroup);
// Supprime un groupe
router.delete("/groups/:id", groupController.deletegroup);
// Déplace un formulaire vers un groupe (id du formulaire et id du groupe dans l'URL)
router.put("/forms/:id/move-to-group/:groupId", groupController.moveFormTogroup);
// Nombre de formulaires dans un groupe
router.get("/groups/:id/count", groupController.getNumberOfForms);

module.exports = router;