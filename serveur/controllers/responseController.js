const responseService = require("../services/responseService");

const submitForm = async (req, res) => {
  const { form_id, user_id, responses } = req.body;

  try {
    if (!responses || responses.length === 0) {
      return res.status(400).json({ error: "Aucune réponse à enregistrer." });
    }

    const message = await responseService.submitForm(form_id, user_id, responses);
    res.status(200).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const saveResponse = async (req, res) => {
  const { form_id, user_id, component_id, value } = req.body;

  try {
    const message = await responseService.saveResponse(form_id, user_id, component_id, value);
    res.status(200).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getResponses = async (req, res) => {
  const { id } = req.params;
  try {
    const grouped = await responseService.getResponses(id);
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  submitForm,
  saveResponse,
  getResponses,
};
