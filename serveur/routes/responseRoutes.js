const express = require("express");
const router = express.Router();
const responseController = require("../controllers/responseController");

router.post("/submit-form", responseController.submitForm);
router.post("/save-response", responseController.saveResponse);
router.get("/forms/:id/responses", responseController.getResponses);

module.exports = router;
