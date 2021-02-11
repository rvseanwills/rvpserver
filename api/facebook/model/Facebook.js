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

//this method search for a Facebook by business_id.
facebookSchema.statics.findByCredential = async (business_id) => {
  const facebook = await Facebook.findOne({ business_id });
  if (!facebook) {
    throw new Error({ error: "Invalid facebook details" });
  }
  
  return facebook;
};

//this method creates a new access token for the facebook login
facebookSchema.statics.returnToken = async (business_id, createNew = false) => {

  //force function to create a new access token by using createNew = true

  var client_id = '289313119164357';
  var client_secret = '0b93b8673fd6c51da81e6f03e30fb083';

  const facebook = await Facebook.findOne({ business_id }).select('access_token');

  if (!facebook) {
    throw new Error({ error: "Invalid facebook details" });
  }

  //Check if their is an existing access token
  if (facebook.access_token.length !== 0 && !createNew && facebook.access_token !== null) {
    return facebook.access_token;
  } else {
    //TODO create new tokens
    //create a function in the controller for creating new tokens
  }

};



const Facebook = mongoose.model("Facebook", facebookSchema);
module.exports = Facebook;

//helpers 

function longToken() {
  // LONG LIVED TOKEN RETRIEVAL
  axios.get("https://graph.facebook.com/v9.0/oauth/access_token?grant_type=fb_exchange_token&client_id=" + client_id
+"&client_secret=" + client_secret +"&fb_exchange_token=" + fbtoken
  ).then( function (response) {

    var longlivedtoken = response.data.access_token;

    // UPDATE LONG LIVED TOKEN 
    Facebook.findOneAndUpdate({facebook_email: facebook_email}, {$set:{'access_token': longlivedtoken}}, {new: true, useFindAndModify: false}, (err, doc) => {
        if (err) {
            console.log({msg: "Something wrong when updating LONG ACCESS TOKEN", err: err} );
        }
    });
  })
  .catch( function (err) {
    console.log({res: err.response.data, msg: 'Error with call to long access token'})

    res.status(401).json({error_name: 'Could not get longlivedtoken', err: err.response.data});
  } )

}
   