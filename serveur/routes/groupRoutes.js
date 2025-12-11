const express = require("express");
const router = express.Router();
const groupController = require("../controllers/groupController");

router.post("/groups", groupController.creategroup);
router.get("/groups", groupController.getAllgroups);
router.get("/groups/:id", groupController.getgroupById);
router.put("/groups/:id", groupController.renamegroup);
router.delete("/groups/:id", groupController.deletegroup);
router.put("/forms/:id/move-to-group/:groupId", groupController.moveFormTogroup);
router.get("/groups/:id/count", groupController.getNumberOfForms);

module.exports = router;
