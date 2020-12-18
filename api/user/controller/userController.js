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
    console.log(token);
    user.tokens = user.tokens[0];
    res.status(201).json({ user, token });
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: 'Invalid Credentials' });
  }
};

exports.getFacebookDetails = async (req, res) => {
  try {

    const email = req.body.email;
    var fbtoken = req.body.facebook.accessToken;
    var facebookpageid = '104192044885856'; //GET THIS FROM DB
    var pagetoken = '';
    var facebookuserid = req.body.facebook.userID;

    User.findOneAndUpdate({email: email}, {$set:{'business.fb_accesstoken': fbtoken}}, {new: true, useFindAndModify: false}, (err, doc) => {
        if (err) {
            console.log("Something wrong when updating data!");
        }

        //REWUESTS
        // TODO CHECK FOR ACCESS TOKEN
    

        //MOVE FACEBOOK REQUESTS TO ANOTHER DIRECTORY
        //MAKE REQUESTS TO FACEBOOK

        axios.get("https://graph.facebook.com/"+facebookpageid+"?fields=access_token&access_token="+fbtoken
        ).then( function (response) {
          pagetoken = response.data.access_token;
          getPageAnalytics(pagetoken);
        })
        .catch( function (err) {
          console.log(err);
          res.send({error_name: 'Could not get pages api',err: err})
        } )

    });

    function getPageAnalytics(pt) {
      //Single metric
        axios.get("https://graph.facebook.com/v9.0/"+facebookpageid+"/insights/page_fans", {params: {
          access_token: pt
        }}).then( function (response) {
          res.status(201).json(response.data);
        }).catch( function (err) {
          res.send({error_name: 'Could not get graph api',err: err})
        })
    }


    
  } catch (err) {
    res.status(400).json({ err: err });
  }
}
exports.getUserDetails = async (req, res) => {
  await res.json(req.userData);
};
