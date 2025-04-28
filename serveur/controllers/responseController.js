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

const getParticipantResponses = async (req, res) => {
  const { form_id, user_id } = req.params;

  try {
    const responses = await responseService.getParticipantResponses(form_id, user_id);
    console.log(responses);
    res.status(200).json({responses:responses});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const shutdown = async (req, res) => {
  try {
    const message = await responseService.shutdownServer();
    res.status(200).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteFormResponses = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await responseService.deleteResponsesByFormId(id);
    res.json(result);
  } catch (error) {
    console.error("Erreur dans deleteFormResponses :", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression des réponses." });
  }
};


module.exports = {
  submitForm,
  saveResponse,
  getResponses,
  getParticipantResponses,
  shutdown,
  deleteFormResponses,
};
