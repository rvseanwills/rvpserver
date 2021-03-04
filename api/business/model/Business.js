const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const businessSchema = mongoose.Schema({
  name: {
      type: String,
      required: true,
      unique: true
  },
  team_ids: [{
    type: String,
    required: true
  }],
  networks: [{
      name: {
          type: String,
          required: true
      },
      access_tokens: [{
        account_name: {
            type: String,
            required: true
        },
        access_token: {
            type: String,
            required: true
        }
      }],
      reportCollections: [{
          insight_type: {
            type: String,
            required: true
          },
          reportCollection_id: {
              type: String,
              required: true
          }
      }]
  }]
}, {collection: 'businessCollection'});


// businessSchema.pre("save", async function(next) {
//   // Hash the password before saving the Report model
//   const Report = this;
//   if (Report.isModified("password")) {
//     Report.password = await bcrypt.hash(Report.password, 8);
//   }
//   next();
// });

//this method search for a Report 
// businessSchema.statics.findByCredentials = async (business_id, social_media, insight_type, page_id = null) => {
//   //Page id is null because some social medias do not have seperate pages
//   const report = await Report.findOne({ business_id, social_media, insight_type, page_id });
//   console.log(report);

//   if (!report) {
//     throw new Error({ error: "Could not find the report being queried" });
//   }

//   return report;
// };


const Business = mongoose.model("Business", businessSchema);
module.exports = Business;
