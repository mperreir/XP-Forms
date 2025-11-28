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

// Controller to duplicate a form
const duplicateForm = async (req, res) => {
  const { id } = req.params; // Get the form ID from request parameters

  try {
    // Call the service to duplicate the form
    const result = await formService.duplicateForm(id);

    // Send the response back with success or failure message
    if (result.success) {
      res.status(200).json({
        message: `Formulaire dupliqué avec succès ! Nouveau Formulaire ID : ${result.newFormId}`,
        newFormId: result.newFormId
      });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error("Erreur lors de la duplication du formulaire:", error);
    res.status(500).json({ error: "Erreur lors de la duplication du formulaire" });
  }
};

const exportForm = async (req, res) => {
  const { id } = req.params; // Get the form ID from request parameters

  try {
    // Call the service to export the form
    const result = await formService.exportForm(id);

    res.json(result);
  } catch (error) {
    console.error("Erreur lors de l'exportation du formulaire:", error);
    res.status(500).json({ error: "Erreur lors de l'exportation du formulaire" });
  }
};

const importForm = async (req, res) => {
  const { title, json_data } = req.body;

  // Générer un ID de formulaire unique
  const generateUniqueFormId = () => {
    return new Promise((resolve, reject) => {
      const tryGenerate = () => {
        const newId = `Form_${Math.random().toString(36).slice(2, 10)}`;
        fetch(`/api/forms/${newId}`)
          .then((row) => {
            return tryGenerate();
          })
          .catch((err) => {
            return reject(err);
          });
        resolve(newId);
      };
      tryGenerate();
    });
  };

  try {
    const newFormID = await generateUniqueFormId();
    json_data.id = newFormID;
    const message = await formService.saveForm(newFormID, title, json_data);
    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.setDefaultUserId = async (req, res) => {
  try {
    const { default_user_id } = req.body;
    const { id } = req.params;
    await formService.setDefaultUserId(id, default_user_id);
    res.json({ message: "Default user ID saved!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error saving default user ID" });
  }
};

exports.getDefaultUserId = async (req, res) => {
  try {
    const { id } = req.params;
    const defaultUserId = await formService.getDefaultUserId(id);
    res.json({ default_user_id: defaultUserId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching default user ID" });
  }
};


module.exports = {
  saveForm,
  getAllForms,
  getFormById,
  hasResponses,
  updateForm,
  deleteForm,
  duplicateForm,
  exportForm,
  importForm,
};