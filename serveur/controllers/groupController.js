const groupServices = require("../services/groupService");

exports.creategroup = async (req, res) => {
  try {
    const { name } = req.body;
    const group = await groupServices.creategroup(name);
    res.json(group);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getAllgroups = async (req, res) => {
  try {
    const groups = await groupServices.getAllgroups();
    res.json(groups);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getgroupById = async (req, res) => {
  try {
    const group = await groupServices.getgroupById(req.params.id);
    if (!group) return res.status(404).json({ error: "groupe introuvable" });
    res.json(group);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.renamegroup = async (req, res) => {
  try {
    const ok = await groupServices.renamegroup(req.params.id, req.body.name);
    res.json({ success: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.deletegroup = async (req, res) => {
  try {
    const ok = await groupServices.deletegroup(req.params.id);
    res.json({ success: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.moveFormTogroup = async (req, res) => {
  try {
    const ok = await groupServices.moveFormTogroup(req.params.id, req.params.groupId);
    res.json({ success: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getNumberOfForms = async (req, res) => {
  try {
    const ok = await groupServices.getNumberOfForms(req.params.id);
    res.json({ count: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


