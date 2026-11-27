// Contrôleur des paramètres : gère l'id participant par défaut, stocké côté serveur
// grâce au service de paramètres (settingsService)
const settingsService = require("../services/settingsService");

// POST: Enregistrer un defaultUserId
const setDefaultUserId = async (req, res) => {
  try {
    // On récupère "defaultUserId" dans le corps de la requête et on le renomme "newId"
    const { defaultUserId: newId } = req.body;
    // Valeur absente ou vide : on refuse la requête
    if (!newId) {
      return res.status(400).json({ error: "Missing defaultUserId" });
    }

    // Le paramètre est enregistré sous la clé 'defaultUserId'
    await settingsService.setSetting('defaultUserId', newId);
    res.json({ success: true, defaultUserId: newId });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du defaultUserId:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

// GET: Récupérer le defaultUserId
const getDefaultUserId = async (req, res) => {
  try {
    const value = await settingsService.getSetting('defaultUserId');
    // Si rien n'a encore été enregistré, on renvoie une chaîne vide plutôt que null
    res.json({ defaultUserId: value || "" });
  } catch (error) {
    console.error("Erreur lors de la récupération du defaultUserId:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

// Fonctions exposées au fichier de routes
module.exports = { setDefaultUserId, getDefaultUserId };