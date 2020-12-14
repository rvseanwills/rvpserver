const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const facebookSchema = mongoose.Schema({
  business_id: {
    type: String,
    required: true,
  },
  facebook_email: {
    type: String,
    required: true,
  },
  access_token: {
    type: String,
    required: true
  },
  pages: [{
    id: {type: String, required: true},
    token: {type: String}
  }]
}, {collection: 'facebook'});


// facebookSchema.pre("save", async function(next) {
//   // Hash the password before saving the Instagram model
//   const Instagram = this;
//   if (Instagram.isModified("password")) {
//     Instagram.password = await bcrypt.hash(Instagram.password, 8);
//   }
//   next();
// });

//this method search for a Facebook by email.
facebookSchema.statics.findByCredential = async (business_id) => {
  const facebook = await Facebook.findOne({ business_id });
  if (!facebook) {
    throw new Error({ error: "Invalid facebook details" });
  }
  
  return facebook;
};

const Facebook = mongoose.model("Facebook", facebookSchema);
module.exports = Facebook;
