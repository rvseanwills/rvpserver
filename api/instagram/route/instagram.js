const express = require("express");
const router = express.Router();
const auth = require("../../../config/auth");
const instagramController = require("../controller/instagramController");

router.get("/getNewStats", auth, instagramController.getNewStats);

module.exports = router;
