const User = require("../model/Instagram");

exports.getNewStats = async (req, res) => {
  try {
    let isUser = await User.find({ email: req.body.email });
    console.log(isUser);
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
      company_id: req.body.company_id
    });
    let data = await user.save();
    const token = await user.generateAuthToken(); // here it is calling the method that we created in the model
    
    res.status(201).json({ data, token });
  } catch (err) {
    res.status(400).json({ err: err });
  }
};

