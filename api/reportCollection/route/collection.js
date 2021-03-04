const express = require("express");
const router = express.Router();
const auth = require("../../../config/auth");
const collectionController = require("../controller/collectionController");

router.post("/getCollection", auth, collectionController.getCollection);


module.exports = router;