const express = require("express");
const router = express.Router();
const folderController = require("../controllers/folderController");

router.post("/folders", folderController.createFolder);
router.get("/folders", folderController.getAllFolders);
router.get("/folders/:id", folderController.getFolderById);
router.put("/folders/:id", folderController.renameFolder);
router.delete("/folders/:id", folderController.deleteFolder);
router.put("/forms/:id/move-to-folder/:folderId", folderController.moveFormToFolder);
router.put("/forms/:id/remove-from-folder", folderController.removeFormFromFolder);

module.exports = router;
