const express = require("express");
const router = express.Router();
const responseController = require("../controllers/responseController");

router.post("/submit-form", responseController.submitForm);
router.post("/save-response", responseController.saveResponse);
router.get("/forms/:id/responses", responseController.getResponses);
router.get("/form-responses-participant/:form_id/:user_id", responseController.getParticipantResponses);
router.post("/shutdown", responseController.shutdown);
router.delete("/forms/:id/responses", responseController.deleteFormResponses);



module.exports = router;
