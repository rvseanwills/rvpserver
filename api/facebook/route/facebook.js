const express = require("express");
const router = express.Router();
const auth = require("../../../config/auth");
const facebookController = require("../controller/facebookController");

router.post("/getNewStats", auth, facebookController.getNewStats);
router.post("/getPageDetails", auth, facebookController.getPageDetails);


module.exports = router;
