const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const instagramSchema = mongoose.Schema({
  job_description: {
    type: String,
    required: [true, "Please Include your job title or description"]
  },
  full_name: {
    type: String,
    required: [true, "Please Include your name"]
  },
  account_type: {
    type: String,
    required: true
  },
  permission_type: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: [true, "Please Include your email"]
  },
  password: {
    type: String,
    required: [true, "Please Include your password"]
  },
  company_id: {
    type: Number,
    required: [true, "Please login again, make sure you are not in a private browser, the company_id has not been saved in your browser"]
  },
  tokens: [
    {
      token: {
        type: String,
        required: true
      }
    }
  ]
});


instagramSchema.pre("save", async function(next) {
  // Hash the password before saving the Instagram model
  const Instagram = this;
  if (Instagram.isModified("password")) {
    Instagram.password = await bcrypt.hash(Instagram.password, 8);
  }
  next();
});

//this method search for a Instagram by full_name and password.
instagramSchema.statics.findByCredentials = async (email, password) => {
  const Instagram = await Instagram.findOne({ email });
  console.log(user);
  if (!user) {
    throw new Error({ error: "Invalid login details" });
  }
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) {
    throw new Error({ error: "Invalid login details" });
  }
  return user;
};

const Instagram = mongoose.model("Instagram", instagramSchema);
module.exports = Instagram;
