const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");

router.get("/default-user-id", settingsController.getDefaultUserId);
router.post("/default-user-id", settingsController.setDefaultUserId);

module.exports = router;
