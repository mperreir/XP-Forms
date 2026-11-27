// Contrôleur des groupes : reçoit les requêtes HTTP, appelle le service (groupService)
// et renvoie la réponse. La logique métier et l'accès à la base sont dans le service.
const groupServices = require("../services/groupService");

// Crée un nouveau groupe à partir du nom reçu dans le corps de la requête
exports.creategroup = async (req, res) => {
  try {
    const { name } = req.body;
    const group = await groupServices.creategroup(name);
    res.json(group);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Renvoie la liste de tous les groupes
exports.getAllgroups = async (req, res) => {
  try {
    const groups = await groupServices.getAllgroups();
    res.json(groups);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Renvoie un groupe à partir de son id (404 s'il n'existe pas)
exports.getgroupById = async (req, res) => {
  try {
    const group = await groupServices.getgroupById(req.params.id);
    if (!group) return res.status(404).json({ error: "groupe introuvable" });
    res.json(group);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Renomme un groupe (nouveau nom dans le corps de la requête)
exports.renamegroup = async (req, res) => {
  try {
    const ok = await groupServices.renamegroup(req.params.id, req.body.name);
    res.json({ success: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Supprime un groupe
exports.deletegroup = async (req, res) => {
  try {
    const ok = await groupServices.deletegroup(req.params.id);
    res.json({ success: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Déplace un formulaire (id dans l'URL) vers un groupe (groupId dans l'URL)
exports.moveFormTogroup = async (req, res) => {
  try {
    const ok = await groupServices.moveFormTogroup(req.params.id, req.params.groupId);
    res.json({ success: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Renvoie le nombre de formulaires contenus dans un groupe
exports.getNumberOfForms = async (req, res) => {
  try {
    const ok = await groupServices.getNumberOfForms(req.params.id);
    res.json({ count: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};