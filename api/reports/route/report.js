const express = require("express");
const router = express.Router();
const auth = require("../../../config/auth");
const reportController = require("../controller/reportController");

router.post("/getMeta", auth, reportController.getMeta);
router.post("/getData", auth, reportController.getData);


module.exports = router;
