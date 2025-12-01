const express = require("express");
const router = express.Router();
const formController = require("../controllers/formController");

router.post("/save-form", formController.saveForm);
router.get("/forms", formController.getAllForms);
router.get("/forms/:id", formController.getFormById);
router.get("/forms/:id/has-responses", formController.hasResponses);
router.put("/forms/:id", formController.updateForm);
router.put("/forms/:id/move", formController.moveForm);
router.delete("/forms/:id", formController.deleteForm);
router.post("/forms/:id/duplicate", formController.duplicateForm);



module.exports = router;
