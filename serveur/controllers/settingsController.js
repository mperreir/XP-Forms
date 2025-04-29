const settingsService = require("../services/settingsService");

// POST: Enregistrer un defaultUserId
const setDefaultUserId = async (req, res) => {
  try {
    const { defaultUserId: newId } = req.body;
    if (!newId) {
      return res.status(400).json({ error: "Missing defaultUserId" });
    }

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
    res.json({ defaultUserId: value || "" });
  } catch (error) {
    console.error("Erreur lors de la récupération du defaultUserId:", error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};

module.exports = { setDefaultUserId, getDefaultUserId };
