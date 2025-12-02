const folderServices = require("../services/folderService");

exports.createFolder = async (req, res) => {
  try {
    const { name, parent_id } = req.body;
    const folder = await folderServices.createFolder(name, parent_id || null);
    res.json(folder);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getAllFolders = async (req, res) => {
  try {
    const parent_id = req.query.parent_id || null;
    const folders = await folderServices.getAllFolders(parent_id);
    res.json(folders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getFolderById = async (req, res) => {
  try {
    const folder = await folderServices.getFolderById(req.params.id);
    if (!folder) return res.status(404).json({ error: "Dossier introuvable" });
    res.json(folder);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.renameFolder = async (req, res) => {
  try {
    const ok = await folderServices.renameFolder(req.params.id, req.body.name);
    res.json({ success: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    const ok = await folderServices.deleteFolder(req.params.id);
    res.json({ success: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.moveFormToFolder = async (req, res) => {
  try {
    const ok = await folderServices.moveFormToFolder(req.params.id, req.params.folderId);
    res.json({ success: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.removeFormFromFolder = async (req, res) => {
  try {
    const ok = await folderServices.removeFormFromFolder(req.params.id);
    res.json({ success: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.duplicateFolder = async (req, res) => {
  try {
    const { newParentId = null } = req.body;
    const ok = await folderServices.duplicateFolder(req.params.id, newParentId);
    res.json({ success: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


