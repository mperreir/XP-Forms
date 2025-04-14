// controllers/formController.js
const formService = require("../services/formService");

const saveForm = async (req, res) => {
  const { id, title, json_data } = req.body;
  try {
    const message = await formService.saveForm(id, title, json_data);
    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllForms = async (req, res) => {
  try {
    const forms = await formService.getAllForms();
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getFormById = async (req, res) => {
  const { id } = req.params;
  try {
    const form = await formService.getFormById(id);
    res.json(form);
  } catch (error) {
    const status = error.message.includes("non trouvé") ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
};

const hasResponses = async (req, res) => {
  const { id } = req.params;
  try {
    const has = await formService.hasResponses(id);
    res.json({ hasResponses: has });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateForm = async (req, res) => {
    const { id } = req.params;
    const { title, json_data } = req.body;
    try {
      const hasResp = await formService.hasResponses(id);
      if (hasResp) {
        return res.status(400).json({ error: "Impossible de modifier un formulaire avec des réponses existantes." });
      }
  
      const cleanSchema = {
        ...json_data,
        components: (json_data.components || []).map(component => ({
          ...component,
          type: component.type || "text"
        }))
      };
      const result = await formService.updateForm(id, title, cleanSchema);
      if (result === 0) {
        return res.status(404).json({ error: "Formulaire non trouvé" });
      }
      res.json({ message: "Formulaire mis à jour avec succès !" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erreur lors de la mise à jour du formulaire" });
    }
  };

const deleteForm = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await formService.deleteForm(id);
    res.json({ message: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  saveForm,
  getAllForms,
  getFormById,
  hasResponses,
  updateForm,
  deleteForm,
};