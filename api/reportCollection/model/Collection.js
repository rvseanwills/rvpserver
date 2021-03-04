const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const collectionSchema = mongoose.Schema({
  business_id: {
    type: String,
    required: true
  },
  report_ids: []
}, {collection: 'reportCollections'});


// collectionSchema.pre("save", async function(next) {
//   // Hash the password before saving the Report model
//   const Report = this;
//   if (Report.isModified("password")) {
//     Report.password = await bcrypt.hash(Report.password, 8);
//   }
//   next();
// });

//this method search for a Report 
collectionSchema.statics.findByCredentials = async (business_id, social_media, insight_type, page_id = null) => {
  //Page id is null because some social medias do not have seperate pages
  const report = await Report.findOne({ business_id, social_media, insight_type, page_id });
  console.log(report);

  if (!report) {
    throw new Error({ error: "Could not find the report being queried" });
  }

  return report;
};



const Collection = mongoose.model("Collection", collectionSchema);
module.exports = Collection;
