const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// TODO - change business ID to object ID and refer to business collectio
const userSchema = mongoose.Schema({
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
  business: {
    business_id : {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
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

userSchema.pre("save", async function(next) {
  // Hash the password before saving the user model
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

//this function generates an auth token for the user
userSchema.methods.generateAuthToken = async function() {

  const user = this;
  const token = jwt.sign(
    { _id: user._id, job_description: user.job_description, full_name: user.full_name, account_type: user.account_type, permission_type: user.permission_type, email: user.email, business_id: user.business.business_id },
    "wemanagetokens"
  );
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

//this method search for a user by full_name and password.
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
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

const User = mongoose.model("User", userSchema);
module.exports = User;
