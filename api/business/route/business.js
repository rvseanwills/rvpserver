const express = require("express");
const router = express.Router();
const auth = require("../../../config/auth");
const businessController = require("../controller/businessController");
//TODO, how do we check that this person is geniune, e.g owns the business, perhaps with bank details

router.post("/create", businessController.createBusiness);
// router.post("/delete", auth, businessController.deleteBusiness);
//TODO Auth needs to check the businesses match up
router.post("/update", auth, businessController.updateBusiness);
// router.post("/read", auth, businessController.readBusiness);

module.exports = router;