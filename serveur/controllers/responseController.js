// Contrôleur des réponses : reçoit les requêtes HTTP, appelle le service (responseService)
// et renvoie la réponse. La logique métier et l'accès à la base sont dans le service.
const responseService = require("../services/responseService");


// Enregistre en une fois toutes les réponses d'un participant à un formulaire
const submitForm = async (req, res) => {
  const { form_id, user_id, responses } = req.body;

  try {
    // Rien à enregistrer : on refuse la requête
    if (!responses || responses.length === 0) {
      return res.status(400).json({ error: "Aucune réponse à enregistrer." });
    }

    const message = await responseService.submitForm(form_id, user_id, responses);
    res.status(200).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Enregistre une seule réponse (appelée à chaque modification d'un champ dans le viewer)
const saveResponse = async (req, res) => {
  const { form_id, user_id, component_id, value } = req.body;

  try {
    const message = await responseService.saveResponse(form_id, user_id, component_id, value);
    res.status(200).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Renvoie toutes les réponses d'un formulaire, regroupées par participant
const getResponses = async (req, res) => {
  const { id } = req.params;
  try {
    const grouped = await responseService.getResponses(id);
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Renvoie les réponses d'un participant précis pour un formulaire
// (utilisé pour pré-remplir le formulaire quand le participant revient)
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

// Arrête le serveur
const shutdown = async (req, res) => {
  try {
    const message = await responseService.shutdownServer();
    res.status(200).json({ message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Supprime toutes les réponses d'un formulaire (le formulaire lui-même est conservé)
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


// Fonctions exposées au fichier de routes
module.exports = {
  submitForm,
  saveResponse,
  getResponses,
  getParticipantResponses,
  shutdown,
  deleteFormResponses,
};