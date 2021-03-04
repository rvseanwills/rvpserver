const User = require("../model/User");
const axios = require("axios");

exports.registerNewUser = async (req, res) => {
  try {
    let isUser = await User.find({ email: req.body.email });
    console.log(isUser, req.body);
    if (isUser.length >= 1) {
      return res.status(409).json({
        message: "This person already has an account"
      });
    }

    const user = new User({
      job_description: req.body.job_description,
      full_name: req.body.full_name,
      account_type: req.body.account_type,
      permission_type: req.body.permission_type,
      email: req.body.email,
      password: req.body.password,
      business_id: req.body.business_id
    });
    let data = await user.save();
    const token = await user.generateAuthToken(); // here it is calling the method that we created in the model
    
    res.status(201).json({ data, token });
  } catch (err) {
    res.status(400).json({ err: err });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;


    const user = await User.findByCredentials(email, password);

    if (!user) {
      return res
        .status(401)
        .json({ error: {name: "InvalidCredentialsError"} });
    }

    const token = await user.generateAuthToken();
  
    user.tokens = user.tokens[0];
    res.status(201).json({ user, token });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: 'Invalid Credentials' });
  }
};


exports.getUserDetails = async (req, res) => {
  await res.json(req.userData);
};
